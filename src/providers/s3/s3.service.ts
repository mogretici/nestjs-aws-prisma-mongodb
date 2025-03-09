import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	PutObjectCommandOutput,
	S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as process from 'process';
import imageThumb from 'image-thumbnail';
import { GenerateUUID } from '@helpers/generateUUID';
import { FileDto } from '../../dto/file.dto';
import { ConfigService } from '@nestjs/config';

interface UploadFileResponse extends PutObjectCommandOutput {
	id: string;
}

/**
 * Service for interacting with the AWS S3 bucket.
 */
@Injectable()
export class S3Service {
	private readonly s3Client: S3Client;
	client!: S3Client;

	config;

	constructor(private configService: ConfigService) {
		this.config = this.configService.get('s3');

		if (!this.config.accessKeyId) {
			throw new Error('S3 accessKeyId is not defined');
		}
		this.s3Client = new S3Client({
			region: this.configService.get('s3.region'),
			credentials: {
				accessKeyId: this.configService.get('s3.accessKeyId'),
				secretAccessKey: this.configService.get('s3.secretAccessKey'),
			},
		});
	}

	/**
	 * Uploads a file to the AWS S3 bucket. The file is uploaded to the given companyId with a generated unique id.
	 * @param file - The file to upload.
	 * @param companyId - The companyId to upload the file to.
	 * @returns UploadFileResponse - The response from the AWS S3 bucket.
	 */
	async uploadFile(
		file: Express.Multer.File,
		companyId: string
	): Promise<UploadFileResponse> {
		if (!file) {
			console.log('AWS SDK Service: No file provided.');
			// return Promise.reject('No file provided.');
		}

		if (!companyId) {
			console.log('AWS SDK Service: No companyId provided.');
			return Promise.reject('No companyId provided.');
		}

		// Generate a unique id for the file.
		const id = GenerateUUID();

		// Generate thumbnail if the file is an image.
		// We will use the original if it's smaller than 250kb
		if (file.mimetype.startsWith('image')) {
			const thumbnail =
				file.size > 250_000
					? await imageThumb(file.buffer, {
							responseType: 'buffer',
							percentage: 10,
						})
					: file.buffer; // Use original image if it's smaller than 250kb.

			// Upload thumbnail to S3 bucket.
			await this.s3Client.send(
				new PutObjectCommand({
					Bucket: this.configService.get('s3.bucketName'),
					Key: `${companyId}/${id}-thumbnail`,
					Body: thumbnail,
					ContentType: file.mimetype,
				})
			);
		} else {
			// Fallthrough case, file is not an image or PDF.
			console.log(
				'S3 Service: File is not an image no thumbnail will be generated.'
			);
		}

		// Upload file to S3 bucket and return the response.
		return {
			...(await this.s3Client.send(
				new PutObjectCommand({
					Bucket: this.configService.get('s3.bucketName'),
					Key: `${companyId}/${id}`,
					Body: file.buffer,
					ContentType: file.mimetype,
				})
			)),
			id: `${companyId}/${id}`, // We concatenate the companyId and the id to make it easier to retrieve the file later.
		};
	}

	async findAndDeleteFile(companyId: string, id: string) {
		try {
			// Get user's company ID from the request.
			// Get file from database.
			const file = await this.getFile(`${id}`);
			console.log('file', file);
			// Remove file from S3 bucket.
			const deleteParams = {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: `${id}`,
			};

			const data = await this.s3Client.send(
				new DeleteObjectCommand(deleteParams)
			);

			console.log('Successfully deleted file.', data);
			const deleteParamsThumbnail = {
				Bucket: this.configService.get('s3.bucketName'),
				Key: `${id}-thumbnail`,
			};
			const dataThumbnail = await this.s3Client.send(
				new DeleteObjectCommand(deleteParamsThumbnail)
			);
			console.log('Successfully deleted thumbnail.', dataThumbnail);
		} catch (e) {
			console.error(e);
			throw new InternalServerErrorException(e);
		}
	}

	async getFile(path: string) {
		const command = new HeadObjectCommand({
			Bucket: this.configService.get('s3.bucketName'),
			Key: path,
		});

		return await this.s3Client.send(command);
	}

	//<editor-fold desc="signUrls">
	/**
	 * This function takes in a mongodb query result and signs url's for images and files
	 * @param data - The query result
	 */
	async signUrls(
		data:
			| {
					images: FileDto[];
					file?: FileDto[];
					[key: string]: any;
			  }
			| {
					images: FileDto[];
					file?: FileDto[];
					[key: string]: any;
			  }[]
	) {
		let res;
		if (Array.isArray(data)) {
			res = await Promise.all(
				data.map(async (d) => {
					return {
						...d,
						images: await Promise.all(
							d.images.map(async (img) => {
								if (!img.id) return img; // This should never happen
								return {
									...img,
									url: await this.createPresignedUrl(
										`${img.id}`,
										`${img.filename}`
									),
									thumbUrl: await this.createPresignedUrl(
										`${img.id}-thumbnail`
									),
								};
							})
						),
						file:
							d.file &&
							(await Promise.all(
								d.file.map(async (file) => {
									if (!file.id) return file; // This should never happen
									return {
										...file,
										url: await this.createPresignedUrl(
											`${file.id}`,
											`${file.filename}`
										),
										thumbUrl: await this.createPresignedUrl(
											`${file.id}-thumbnail`
										),
									};
								})
							)),
					};
				})
			);
		} else {
			data.file =
				data.file &&
				(await Promise.all(
					data.file.map(async (file) => {
						if (!file.id) return file; // This should never happen
						return {
							...file,
							url: await this.createPresignedUrl(
								`${file.id}`,
								`${file.filename}`
							),
							thumbUrl: await this.createPresignedUrl(`${file.id}-thumbnail`),
						};
					})
				));

			data.images =
				data.images &&
				(await Promise.all(
					data.images.map(async (img: FileDto) => {
						if (!img.id) return img; // This should never happen
						return {
							...img,
							url: await this.createPresignedUrl(
								`${img.id}`,
								`${img.filename}`
							),
							thumbUrl: await this.createPresignedUrl(`${img.id}-thumbnail`),
						};
					})
				));
			// Iterate through keys and sign urls for images and files
			for (const key in data) {
				if (Object.prototype.hasOwnProperty.call(data, key)) {
					const element = data[key]; // This is the value of the key
					// Look for images array and file object then sign urls
					if (Array.isArray(element)) {
						// We found a sub object that is an array
						// Look for images and file in the items of the array
						for (const item of element) {
							if (item?.images) {
								for (const img of item.images) {
									if (!img.id) console.log('This should never happen'); // This should never happen
									img.url = await this.createPresignedUrl(
										`${img.id}`,
										`${img.filename}`
									);
									img.thumbUrl = await this.createPresignedUrl(
										`${img.id}-thumbnail`
									);
								}
							}
							if (item?.file) {
								for (const f of item.file) {
									if (!f.id) console.log('This should never happen'); // This should never happen
									f.url = await this.createPresignedUrl(
										`${f.id}`,
										`${f.filename}`
									);
									f.thumbUrl = await this.createPresignedUrl(
										`${f.id}-thumbnail`
									);
								}
							}
						}
					} else {
						// We found a sub object that is not an array
						// Look for images and file in the sub object
						if (element?.images) {
							element.images.forEach((img: any) => {
								if (!img.id) return img; // This should never happen
								img.url = this.createPresignedUrl(
									`${img.id}`,
									`${img.filename}`
								);
								img.thumbUrl = this.createPresignedUrl(`${img.id}-thumbnail`);
							});
						}
						if (element?.file) {
							element.file.forEach((f: any) => {
								if (!f.id) return f; // This should never happen
								f.url = this.createPresignedUrl(`${f.id}`, `${f.filename}`);
								f.thumbUrl = this.createPresignedUrl(`${f.id}-thumbnail`);
							});
						}
					}
				}
			}
			res = data;
		}
		return res;
	}

	//</editor-fold>

	/**
	 * Creates a presigned url for the given fullPath. The url expires after the given amount of seconds.
	 * This operation happens on the backend, so it's not billed.
	 * @param fullPath - The fullPath to create a presigned url for.
	 * @param fileName
	 * @param isExpirable
	 * @returns string - presigned url string.
	 */
	async createPresignedUrl(
		fullPath: string,
		fileName?: string,
		isExpirable: boolean = true
	) {
		const extension = fileName?.split('.').pop();
		let contentType;
		extension === 'xls'
			? (contentType = 'application/vnd.ms-excel')
			: extension === 'xlsx'
				? (contentType =
						'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
				: extension === 'doc'
					? (contentType = 'application/msword')
					: extension === 'docx'
						? (contentType =
								'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
						: extension === 'ppt'
							? (contentType = 'application/vnd.ms-powerpoint')
							: extension === 'pptx'
								? (contentType =
										'application/vnd.openxmlformats-officedocument.presentationml.presentation')
								: extension === 'pdf'
									? (contentType = 'application/pdf')
									: extension === 'png'
										? (contentType = 'image/png')
										: extension === 'jpg'
											? (contentType = 'image/jpeg')
											: extension === 'jpeg'
												? (contentType = 'image/jpeg')
												: extension === 'gif'
													? (contentType = 'image/gif')
													: extension === 'csv'
														? (contentType = 'text/csv')
														: (contentType = 'application/octet-stream');

		const command = new GetObjectCommand({
			Bucket: this.configService.get('s3.bucketName'),
			Key: fullPath,
			ResponseContentType: contentType,
			ResponseContentDisposition: `inline; filename=${fileName}.${extension}`,
		});
		if (isExpirable) {
			return await getSignedUrl(this.s3Client, command, {
				expiresIn: 604800 /* 1 week */,
			});
		}
		return await getSignedUrl(this.s3Client, command, {
			expiresIn: parseInt(this.configService.get('s3.signExpires') || '300'),
		});
	}
}

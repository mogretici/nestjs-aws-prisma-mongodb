import {
	ArgumentsHost,
	Catch,
	HttpException,
	HttpServer,
	HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@backendPrisma';
import { PRISMA_API_ERROR } from '@constants/errors.constants';

export type ErrorCodesStatusMapping = {
	[key: string]: number;
};

/**
 * {@link PrismaClientExceptionFilter}
 * Catches {@link Prisma.PrismaClientKnownRequestError}
 * and {@link Prisma.PrismaClientUnknownRequestError} exceptions.
 */
@Catch(
	Prisma?.PrismaClientKnownRequestError,
	Prisma?.PrismaClientUnknownRequestError
)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
	private errorCodesStatusMapping: ErrorCodesStatusMapping = {
		P2000: HttpStatus.BAD_REQUEST,
		P2002: HttpStatus.CONFLICT,
		P2003: HttpStatus.CONFLICT,
		P2025: HttpStatus.NOT_FOUND, // Record not found
	};

	constructor(
		applicationRef?: HttpServer,
		errorCodesStatusMapping?: ErrorCodesStatusMapping
	) {
		super(applicationRef);
		if (errorCodesStatusMapping) {
			this.errorCodesStatusMapping = Object.assign(
				this.errorCodesStatusMapping,
				errorCodesStatusMapping
			);
		}
	}

	catch(
		exception:
			| Prisma.PrismaClientKnownRequestError
			| Prisma.PrismaClientUnknownRequestError
			| any,
		host: ArgumentsHost
	) {
		if (exception instanceof Prisma.PrismaClientKnownRequestError) {
			return this.catchClientKnownRequestError(exception, host);
		}
		if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
			return this.catchUnknownRequestError(exception, host);
		}
		return super.catch(exception, host);
	}

	private catchClientKnownRequestError(
		exception: Prisma.PrismaClientKnownRequestError,
		host: ArgumentsHost
	) {
		const statusCode =
			this.errorCodesStatusMapping[exception.code] ||
			HttpStatus.INTERNAL_SERVER_ERROR;
		const message = this.exceptionShortMessage(exception.message);

		const [code] = PRISMA_API_ERROR.split(':');

		super.catch(
			new HttpException(
				{
					success: false,
					error: {
						details: exception.code,
						message,
						code: parseInt(code, 10),
					},
				},
				statusCode
			),
			host
		);
	}

	private catchUnknownRequestError(
		exception: Prisma.PrismaClientUnknownRequestError,
		host: ArgumentsHost
	) {
		super.catch(
			new HttpException(
				{
					success: false,
					error: {
						message: 'An unknown error occurred in the Prisma client.',
					},
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			),
			host
		);
	}

	private exceptionShortMessage(message: string): string {
		const shortMessage = message.includes('→')
			? message.substring(message.indexOf('→'))
			: message;
		return shortMessage.replace(/\n/g, '').trim();
	}
}

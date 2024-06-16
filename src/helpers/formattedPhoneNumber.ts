export function formattedPhoneNumber(
  phone: string,
  countryCode: string = '+90',
) {
  //remove all non-digit characters
  phone = phone.replace(/\D/g, '');
  //remove country code
  if (phone.length > 10) {
    phone = phone.substring(phone.length - 10);
  }
  //add country code
  phone = countryCode + phone;
  return phone;
}

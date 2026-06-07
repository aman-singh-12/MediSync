// OTP util: generate a simple 6-digit numeric one-time password.
const generateOtp = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
	generateOtp,
};

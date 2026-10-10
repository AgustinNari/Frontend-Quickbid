const apiUrls = {
  public: 'https://quickbid-backend-demo.onrender.com',
  localReverse: 'http://localhost:8080',
  emulator: 'http://10.0.2.2:8080',
};

function getApiMode() {
  const mode = process.env.QUICKBID_API_MODE || 'public';
  if (!Object.prototype.hasOwnProperty.call(apiUrls, mode)) {
    throw new Error(`QUICKBID_API_MODE inválido: ${mode}`);
  }
  return mode;
}

module.exports = { getApiMode, apiUrls };

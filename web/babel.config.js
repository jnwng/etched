module.exports = (api) => {
  api.cache(true);

  const isTest = process.env.NODE_ENV === 'test';
  if (isTest) {
    return {
      presets: ['@babel/preset-env', '@babel/preset-typescript'],
    };
  } else {
    return {};
  }
};

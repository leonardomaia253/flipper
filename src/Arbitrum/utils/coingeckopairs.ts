import axios from 'axios';

async function getTopArbitrumTokens() {
  const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
    params: {
      vs_currency: 'usd',
      category: 'arbitrum-ecosystem',
      order: 'market_cap_desc',
      per_page: 30,
      page: 1
    }
  });

  const tokens = await Promise.all(response.data.map(async (token: any) => {
    const details = await axios.get(`https://api.coingecko.com/api/v3/coins/${token.id}`);
    const address = details.data.platforms['arbitrum-one'];
    return {
      address: address,
      symbol: token.symbol,
      decimals: 18  // Ajustar conforme dados específicos
    };
  }));

  console.log(tokens);
}

getTopArbitrumTokens();

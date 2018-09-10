import TelegramBot from 'node-telegram-bot-api'
import config from 'config'
import Agent from 'socks5-https-client/lib/Agent'

const WavesAPI = require('@waves/waves-api');
const Waves = WavesAPI.create(WavesAPI.TESTNET_CONFIG);

const TOKEN = config.get('token');
const proxy_host = config.get('proxy_host');
const proxy_port = config.get('proxy_port');
// If authorization is needed:
//const proxy_host = config.get('proxy_user');
//const proxy_port = config.get('proxy_passwd');

const bot = new TelegramBot(TOKEN, {
   polling: true,
   request: {
        agentClass: Agent,
        agentOptions: {
            socksHost: proxy_host,
            socksPort: proxy_port,
            // If authorization is needed:
            // socksUsername: proxy_user,
            // socksPassword: proxy_passwd
        }
    }
});

bot.onText(/\/start/, function onStartText(msg) {
  bot.sendMessage(msg.chat.id, 'type /send your_waves_wallet_address\nexample: /send 3N3x9tXMHD2EXF7iaRMeZfrH1ARB1j9tDWi');
});

bot.onText(/\/help/, function onHelpText(msg) {
  bot.sendMessage(msg.chat.id, 'type /send your_waves_wallet_address\nexample: /send 3N3x9tXMHD2EXF7iaRMeZfrH1ARB1j9tDWi');
});

bot.onText(/\/send (.+)/, function onSendText(msg, match) {
  const resp = match[1];
  const bot_waves_address = config.get('bot_waves_address');
  const amount = config.get('amount');
  const seed_phrase = config.get('bot_seed');
  const seed = Waves.Seed.fromExistingPhrase(seed_phrase);

  const transferData = {
    recipient: resp,
    assetId: 'WAVES',
    amount: amount,
    feeAssetId: 'WAVES',
    fee: 100000,
    attachment: '',
    timestamp: Date.now()
  };

  Waves.API.Node.transactions.broadcast('transfer', transferData, seed.keyPair).then((responseData) => {
      bot.sendMessage(msg.chat.id, (amount / Math.pow(10, 8)) + ' Waves tokens was transfered to you');
  }).catch(function(e){
    switch (e.data.error) {
      case 112:
        bot.sendMessage(msg.chat.id, 'Sorry, bot doesn\'t have enough money. Please try again later.')
        break;
      case 199:
        bot.sendMessage(msg.chat.id, 'Invalid address string, check your credentials and try again.')
        break;
      default:
        bot.sendMessage(msg.chat.id, 'Service error occured')
    }
  });
});

// Import the discord.js module
const Discord = require('discord.js');
// const SpotifyWebApi = require('spotify-web-api-node');
const { Readable } = require('stream');
const https = require('https');
const youtubedl = require('youtube-dl');

const keys = require('./keys.js');
console.log(keys);
// Create an instance of a Discord client
const client = new Discord.Client();
// const spotify = new SpotifyWebApi({
//   clientId : '',
//   clientSecret : '',
//   redirectUri : 'http://www.example.com/callback'
// });

// spotify.clientCredentialsGrant().then(function(data) {
//   console.log('The access token expires in ' + data.body['expires_in']);
//   console.log('The access token is ' + data.body['access_token']);
//   spotify.setAccessToken(data.body['access_token']);
// })

// The token of your bot - https://discordapp.com/developers/applications/me
const token = keys.discordKey;
const googleToken = keys.youtubeKey;
let guilds = {};

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', () => {
  console.log('I am ready!');
  init();
});

client.on('disconnect', event => {
  // if (con) {
  //   //con.disconnect();
  // }
});

// Create an event listener for new guild members
client.on('message', message => {
  let cmd;
  let command;
  if (message.content.startsWith('-')) {
    let index = message.content.indexOf(' ') < 0 ? message.content.length : message.content.indexOf(' ');
    cmd = message.content.substr(1, index - 1);
    console.log('cmd: ' + cmd);
    command = message.content.substr(index + 1);
    console.log('command: ' + command);
  } else {
    return;
  }
  if (cmd === 'join'){
    joinVoice(message);
    return;
  }

  if (checkVoice(message)) {
    switch(cmd) {
      case 'play':
        message.reply('Hey');
        break;
      case 'search':
        handleSearch(message, command);
        break;
      case 'leave':
        leaveVoice(message);
        break;
    }
  }
});

function leaveVoice(message) {
  let guildId = message.member.guild.id;
  let guild = guilds.get(guildId);
  if (guild && guild.voiceChannelID) {
    let channel = guild.channels.get(guild.voiceChannelID);
    channel.leave();
  }
}

function checkVoice(message) {
  let guildId = message.member.guild.id;
  let guild = guilds.get(guildId);
  if (!guild) {
    message.reply('Bardy-bot not found in this guild');
    return false;
  }
  if (!guild.voiceChannelID || !guild.connection) {
    message.reply('Bardy-bot is not connected to a voice channel');
    return false;
  }
  if (guild.voiceChannelID !== message.member.guild.voiceChannelID) {
    message.reply('You are not in the same channel as Bardy-bot');
    return false;
  }
  return true;
}

function joinVoice(message) {
  if (message.member.voiceChannel) {
    message.member.voiceChannel.join().then(connection => { 
        let guild = guilds.get(message.member.guild.id);
        let voiceId = message.member.voiceChannelID;
        guild.connection = connection;
        guild.voiceChannelID = voiceId;
        message.reply('I have successfully connected to the channel!');
      })
      .catch(console.log);
  } else {
    message.reply('You need to join a voice channel first!');
  }        
}

function handleSearch(message, term) {
  console.log('search ran: ' + term);
  var url = 'https://www.googleapis.com/youtube/v3/search?type=video&key=<key>=snippet&q=';
  url += term;
  https.get(url, res => {
    let data = ''
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      var results = JSON.parse(data);
      var firstTrack = results.items[0];
      results.items.forEach(track => {
        console.log('http://www.youtube.com/watch?v=' + track.id.videoId);
      });
      let con = guilds.get(message.member.guild.id).connection;
      console.log('')
      if (con) {
        var trackUrl = 'http://www.youtube.com/watch?v=' + firstTrack.id.videoId;
        con.playStream(youtubedl(trackUrl));
        message.channel.send('Now Playing: ' + firstTrack.snippet.title + ' (' + trackUrl + ')', {code:true});
      }
      
    });    
  });

  // spotify.searchTracks(term).then(function(data) {
  //   let tracks = data.body.tracks.items;
  //   let output = '';
  //   tracks.forEach((track, index) => {
  //     output += track.artists[0].name + ' - ' + track.name + '\n'; 
  //   });
  //   message.channel.send(output, {code:true});
  //   let con = guilds.get(message.member.guild.id).connection;
  //   if (con) {
  //     let track = tracks[0].artists[0];
  //     console.log(track);
  //     //let uri = 'https://open.spotify.com/embed?uri=' + track.uri;
  //     let uri = 'https://open.spotify.com/artist/0iEtIxbK0KxaSlF7G42ZOp';
  //     let embed = new Discord.RichEmbed({ url: uri });
  //     //let embed = new Discord.RichEmbed({ url: '<iframe src="' + track.uri + '" width="300" height="380" frameborder="0" allowtransparency="true"></iframe>'});
  //     console.log(embed);
  //     message.channel.send('Test', { title: 'Title', embed: embed});
  //     // https.get(uri, res => {
  //     //   let data = ''
  //     //   res.on('data', chunk => {
  //     //     data += chunk;
  //     //   });
  //     //   res.on('end', () => {
  //     //     console.log(data);
  //     //     message.channel.send(data);
  //     //   });
  //     //   //const dispatcher = con.playStream(res);
  //     // });
  //   } else {
  //     message.channel.send('bardy-bot is not in a voice channel');
  //   }
  // }, function(error) {
  //   console.error(error);
  // });
}
// Log our bot in
client.login(token);

function init() {
  //console.log(client.guilds);
  let bardy = client.fetchUser('365202028974178314');
  guilds = client.guilds;
  guilds.forEach(function(guild) {
    guild.fetchMember('365202028974178314').then(function(member) {
      guild.voiceChannelID = member.voiceChannelID;
      if (member.voiceChannelID) {
        let voiceChannel = guild.channels.get(member.voiceChannelID);
        if (voiceChannel) {
          voiceChannel.join().then(function(connection) {
            guild.connection = connection;
          });
        }
      }
    });
  }, this);
}

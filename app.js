const discord = require('discord.js');
const ytdl = require('ytdl-core');
const search =require('yt-search');
require('dotenv/config');
const http= require('http');
const port = process.env.PORT || 3000;
//server
http.createServer().listen(port);

const bot = new discord.Client();

const streamOptions = { seek: 0, volume: 1 };

var datas={
    VoiceChannel:null,
    voiceConnection:null,
    musicUrls:[],
    musicTitles:[],
    numUrls:0,
    skip: false,
    url:undefined,
}
bot.on('ready', ()=>{
    console.log('biri beni mi çağırdı');
})
let prefix='!';
bot.login(process.env.TOKEN);
bot.on('message',async msg=>{
    if(!msg.content.startsWith(prefix)) return;
    if(msg.author.bot) return;
    let args=msg.content.split(' ').slice(1);
    let result=args.join(' ');
    let searchContent = msg.content.substr(5);

    if(msg.content.split(' ')[0]==='!setGame')
        bot.user.setActivity(result);
    if(msg.content.split(' ')[0]==='!state'){
        if(result==='online' || result==='idle' || result==='invisible' || result==='dnd') 
            bot.user.setStatus(result);
        else return;
    }
    if(msg.content.split(' ')[0]==='!play'){
        search(searchContent,function(err,res){
            if(err) throw err
            let videos = res.videos.slice(0,5);
            var response=[];
            for(i=0;i<videos.length;i++){
                 response[i] = `\n${i+1}) ${videos[i].title}`;
            }
            const embed = new discord.RichEmbed();
            embed.setAuthor(bot.user.username,bot.user.displayAvatarURL);
            embed.setDescription(response);
            msg.channel.send(embed);

            msg.channel.send('**HANGİSİNİ SEÇEYİM?**');
            const filter = m =>!isNaN(m.content) && m.content>0 && m.content<videos.length+1;
            const collector = msg.channel.createMessageCollector(filter);
            collector.videos=videos;
            collector.once('collect',function(m){
                datas.url=this.videos[parseInt(m.content)-1].url;
                datas.url="https://www.youtube.com"+datas.url;
                let Title=this.videos[parseInt(m.content)-1].title;
                console.log(Title);
                play(datas.url,Title);
            })
            console.log(datas.url);
        });
        async function play(url,Title){
        datas.musicTitles.push(Title);
        datas.VoiceChannel = msg.guild.channels.find(channel => channel.id ==='509009367065034775');
        // console.log(datas.url);
        if(ytdl.validateURL(url)){
            console.log('valid url');
            var flag = datas.musicUrls.some(element=>element===url);
            if(!flag){
                datas.musicUrls.push(url);
                datas.numUrls++;
                if(datas.VoiceChannel!=null){
                    if(datas.VoiceChannel.connection){
                        console.log('connection exist');
                        const embed = new discord.RichEmbed();
                        embed.setAuthor(bot.user.username,bot.user.displayAvatarURL);
                        embed.setDescription("Şarkı listeye eklendi");
                        msg.channel.send(embed);
                    }
                    else{
                        try{
                            datas.voiceConnection= await datas.VoiceChannel.join();
                            await playSong(msg.channel,datas.voiceConnection,datas.VoiceChannel);
                        }catch(ex){
                            console.log(ex);
                        }
                    }
                }
            }
        }}
    }
    if(msg.content.split(' ')[0]==='!skip'){
        datas.skip=true;
        playSong(msg.channel,datas.voiceConnection,datas.VoiceChannel);

    }
    if(msg.content.split(' ')[0]==='!playlist'){

        var embedList = datas.musicTitles.slice();
        for(i=0;i<datas.numUrls;i++){
            embedList[i]=`\n${i+1}) ${embedList[i]}`;
            
        }
        const embed = new discord.RichEmbed();
        embed.setAuthor(bot.user.username,bot.user.displayAvatarURL);
        embed.setDescription(`**ŞARKI LİSTESİ**\n${embedList}`);
        msg.channel.send(embed);

    }
})
bot.on('error', err=>{
    console.log(err);
})
async function playSong(messageChannel,voiceConnection,VoiceChannel){
    const stream=ytdl(datas.musicUrls[0],{filter: 'audioonly'});
    const dispatcher = voiceConnection.playStream(stream,streamOptions);

    const embed = new discord.RichEmbed();
    embed.setAuthor(bot.user.username,bot.user.displayAvatarURL);
    embed.setDescription(`Şuan çalan şarkı ${datas.musicUrls[0]}`);
    // msg.channel.send(embed);

    if(datas.skip===true){
        console.log("Şarkı sonlandı");
        dispatcher.end("ended");
        datas.skip=false;
    }

    dispatcher.on('end',()=>{

    if(datas.musicUrls.length-1==0)
        VoiceChannel.leave();
    else{
        datas.musicUrls.shift();
        setTimeout(()=>{
            playSong(messageChannel,voiceConnection,VoiceChannel);
        },1000);
    }
    })
}
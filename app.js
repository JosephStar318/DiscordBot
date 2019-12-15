const discord = require('discord.js');
const ytdl = require('ytdl-core');
const search =require('yt-search');
require('dotenv/config');
const http= require('http');
const port = process.env.PORT || 3000;
//server
http.createServer().listen(port);

const bot = new discord.Client();
const embed = new discord.RichEmbed();

const streamOptions = { seek: 0, volume: 1 };

var datas={
    VoiceChannel:null,
    voiceConnection:null,
    stream:null,
    dispatcher:null,
    musicUrls:[],
    musicTitles:[],
    timestamps:[],
    numUrls:0,
    skip: false,
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
                 response[i] = `\n**${i+1})** ${videos[i].title} **[${videos[i].timestamp}]**`;
            }
            response[i]=`\n**İPTAL ETMEK İÇİN 0 GİRİN**`;
            embed.setAuthor(bot.user.username,bot.user.displayAvatarURL);
            embed.setDescription(response);
            msg.channel.send(embed);

            msg.channel.send('**HANGİSİNİ SEÇEYİM?**');
            // if(isNaN(msg.content)) return;
            const filter = m =>(!isNaN(m.content) && parseInt(m.content)>=0 && m.content<videos.length+1);
            const collector = msg.channel.createMessageCollector(filter);
            collector.videos=videos;

            collector.once('collect',function(m){
                console.log(m.content);
                if(parseInt(m.content)===0){
                    console.log(parseInt(m.content));//wıp
                    msg.channel.send("Seçim iptal edildi");
                    collector.stop();
                }else{
                    let url=this.videos[parseInt(m.content)-1].url;
                    url="https://www.youtube.com"+url;
                    let Title=this.videos[parseInt(m.content)-1].title;
                    let Timestamp=this.videos[parseInt(m.content)-1].timestamp;
                    console.log(Title);
                    
                    play(url,Title,Timestamp);
                }
                
            })
        });
        async function play(url,Title,Timestamp){
        datas.musicTitles.push(Title);
        datas.timestamps.push(Timestamp);
        var botID=bot.user.lastMessage.member.voiceChannelID;
        if(msg.author.lastMessage.member.voiceChannelID===botID)
            var ID=msg.author.lastMessage.member.voiceChannelID;
        else if(botID!==undefined && botID!==null)
            var ID=botID;
        else
            var ID=msg.author.lastMessage.member.voiceChannelID;
            
        console.log(botID);
        datas.VoiceChannel = msg.guild.channels.find(channel => channel.id ===ID);
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
                            datas.voiceConnection = await datas.VoiceChannel.join();
                            console.log("bot müzik çalmak için katıldı");
                            await playSong(msg.channel,datas.voiceConnection,datas.VoiceChannel,0);
                            embed.setAuthor(bot.user.username,bot.user.displayAvatarURL);
                            embed.setDescription(`Şuan çalan şarkı ${datas.musicTitles[0]} **[${datas.timestamps[0]}]**`);
                            msg.channel.send(embed);
                        }catch(ex){
                            console.log(ex);
                        }
                    }
                }else{
                    console.log("bağlantı yok");
                    msg.channel.send("Üye ses kanalında değil :(");
                }
            }
        }}
    }
    if(msg.content.split(' ')[0]==='!skip'){
        datas.skip=true;
        var a=parseInt(result);
        if(!isNaN(a) && a!=1){
            console.log(!isNaN(a));
            embed.setAuthor(bot.user.username,bot.user.displayAvatarURL);
            embed.setDescription(`Geçilen şarkı: ${datas.musicTitles[a-1]}`);
            if(datas.numUrls>0) msg.channel.send(embed);

            datas.musicTitles.splice(a-1,1);
            datas.musicUrls.splice(a-1,1);
            datas.timestamps.splice(a-1,1);
            datas.numUrls--;
        }else {
            datas.dispatcher.end();
        }
    }
    if(msg.content.split(' ')[0]==='!playlist'){
        var embedList = datas.musicTitles.slice();
        for(i=0;i<datas.numUrls;i++)
            embedList[i]=`\n${i+1}) ${embedList[i]} **[${datas.timestamps[i]}]**`;
        
        embed.setAuthor(bot.user.username,bot.user.displayAvatarURL);
        embed.setDescription(`**ŞARKI LİSTESİ**\n${embedList}`);
        msg.channel.send(embed);

    }
    if(msg.content.split(' ')[0]==='!help'){
        embed.setAuthor(bot.user.username,bot.user.displayAvatarURL);
        embed.setDescription(`**KOMUTLAR**\n 
        1)!state => botun durumunu değiştirir.(idle,dnd,onlinde,invisible)\n
        2)!setGame => botun oynadığı oyunu değiştirir.(istediğin herşey :D)\n
        3)!play => youtube şarkı araması yapar ardından istediğin şarkının numarasını gir.\n
        4)!playlist => oynatma listesini gösterir.\n
        5)!skip => istenilen şarkıyı geçer.\n
        6)!pause => müziği durdurur.\n
        7)!resume =>  müziğe tam gaz devam eder.\n
        8)!reset => botu resetler.\n
        9)!hot => yazı tura.\n
        10)!dice => 2'li zar atar.`);
        msg.channel.send(embed);
    }
    if(msg.content.split(' ')[0]==='!dice'){
        var dice1 = Math.round((Math.random()*5)+1);
        var dice2 = Math.round((Math.random()*5)+1);
        
        msg.channel.send(`Zarlarrrrrr! ${dice1} ile ${dice2} geldi.`);
    }
    if(msg.content.split(' ')[0]==='!hot'){
        var sayi = Math.round(Math.random());
        if(sayi==1) a='TURA';
        else a='YAZI';
        msg.channel.send(a);
    }
    if(msg.content.split(' ')[0]==='!reset'){
        playSong(msg.channel,datas.voiceConnection,datas.VoiceChannel,1);
    }
    if(msg.content.split(' ')[0]==='!pause'){
        console.log("müzik durduruldu.");
        datas.dispatcher.pause();

    }
    if(msg.content.split(' ')[0]==='!resume'){
        console.log("müziğe devam ediliyor");
        datas.dispatcher.resume();
    }



    // if(msg.content.split(' ')[0]==='!set'){
    //     var user=msg.content.split(" ").splice(1,1);//dizi
    //     var input=msg.content.split(" ").slice(2,10).join(" ");//string
    //     console.log(GuildMember.nickname);
    //     console.log(user,input);
    // }         WIP



    async function playSong(messageChannel,voiceConnection,VoiceChannel,reset){
        if(reset){
            VoiceChannel.leave();
            datas.numUrls=0;
            datas.musicTitles=[];
            datas.musicUrls=[];
            datas.timestamps=[];
            return;
        }
        datas.stream=ytdl(datas.musicUrls[0],{filter: 'audioonly'});
        datas.dispatcher = voiceConnection.playStream(datas.stream,streamOptions);

        datas.dispatcher.on('end',()=>{
            console.log("sonlanan şarkı buraya geldi.");
        if(datas.musicUrls.length==1){
            console.log("bütün şarkılar bitti.");
            msg.channel.send("Tüm şarkılar bitti dostum.");
            VoiceChannel.leave();
            console.log("bot kanaldan ayrıldı.");
            datas.musicUrls.shift();
            datas.musicTitles.shift();
            datas.timestamps.shift();
            datas.numUrls--;
        }
        else{
            console.log("sonraki şarkıya geçiliyor.");
            datas.musicUrls.shift();
            datas.musicTitles.shift();
            console.log(datas.timestamps);
            datas.timestamps.shift();
            console.log(datas.timestamps);
            datas.numUrls--;
            embed.setAuthor(bot.user.username,bot.user.displayAvatarURL);
            embed.setDescription(`Şuan çalan şarkı ${datas.musicTitles[0]} **[${datas.timestamps[0]}]**`);
            msg.channel.send(embed);
            setTimeout(()=>{
                playSong(messageChannel,voiceConnection,VoiceChannel,0);
            },2000);
        }
        })
    }
})
bot.on('error', err=>{
    console.log(err);
})

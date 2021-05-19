var secretJson = require("./secret.json"); //See secretStruct.json to create your own secret.json
var fs = require('fs');
var serversData = require("./servers-data.json");
//discord
const Discord = require("discord.js");
require('discord-reply');
const config = require("./config.json");
const { allowedNodeEnvironmentFlags } = require("process");
const client = new Discord.Client();
client.login(config.BOT_TOKEN);
const existingFuncs = ["addrole","remrole","kick","ban","changeperm"]
////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////           Global Variables           ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////               Discord               ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////
const prefix = '*';

function getMyRoles(message){
    message.guild.members.cache.forEach(member => console.log(member.name,member.id));
}

function rolesList(message){
    //let myRole = message.guild.roles.cache.get("264410914592129025");
    console.log("Aqui");
    // get all members
    let allMembers = message.guild.members.cache.forEach(member => console.log(member.user.username,member.id));
    console.log(message.guild.members.cache.size);

    //get all roles
    let allRoles = message.guild.roles.cache.forEach(role => console.log(role.name, role.id,role.rawPosition));
    console.log(message.guild.roles.cache.size);
}


function addServer(guild){
    console.log(serversData);
    if (JSON.stringify(serversData) === "{}"){
        serversData = {"servers":[]};
    }
    serversData["servers"].push({"guildId":Number(guild.id),"changeperm":{"waittime":20000,"permission":"default"},"addrole":{"waittime":10000,"permission":"default"},"remrole":{"waittime":10000,"permission":"default"},"ban":{"waittime":30000,"permission":"default"},"kick":{"waittime":10000,"permission":"default"}})
    writeMsg('servers-data.json',JSON.stringify(serversData));
}

//let memberId = args[0].replace(/[<@!>]/g, '');
//let roleId = args[1].replace(/[<@&>]/g, '');
//let member = message.guild.members.cache.find(u => u.id === memberId);
//console.log("Start member:\n\n",member,"\n\nEnd member\n\n");
//console.log("Start Role:\n\n",role,"\n\nEnd Role\n\n");
//let role = message.guild.roles.cache.find(r => r.id === roleId);
//console.log(member.roles.cache);
//console.log("member id = ",memberId);
//console.log("Role id = ",roleId);


//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////               Add/Rem Role               //////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

function writeMsg(path,text){
    fs.writeFile(path, text, function (err) {
        if (err) throw err;
        console.log('Text Writen!');
    }); 
}

function getUserMaxRolePos(member){
    let maxPos = 0;
    member.roles.cache.forEach(role => {
        if(role.rawPosition > maxPos) maxPos = role.rawPosition;
    });
    return Number(maxPos);
}


function pollResut(message){
    let inVotePermission = null;
    let personOfPermission = message.mentions.members.first();
    if(personOfPermission === undefined){
        inVotePermission = getUserMaxRolePos(message.guild.me) - 1;
    }
    else{
        inVotePermission = getUserMaxRolePos(personOfPermission);
    }

    console.log("User perm = ",inVotePermission);
    let inFavorIt = 0;
    let againstIt = 0;
    let text = "***Votes in favor***:\n";
    message.reactions.cache.get('👍').users.cache.forEach(reactor =>{
        if(reactor.bot){}
        else if(getUserMaxRolePos(message.guild.members.cache.find(u => u.id === reactor.id)) < inVotePermission){}
        else{
            text += "\t<@"+String(reactor.id)+">\n";
            inFavorIt += 1;
        }
    });
    if(inFavorIt === 0) text += "\tNone\n";
    text += "***Votes against***:\n";
    message.reactions.cache.get('👎').users.cache.forEach(reactor =>{
        if(reactor.bot){}
        else if(getUserMaxRolePos(message.guild.members.cache.find(u => u.id === reactor.id)) < inVotePermission){}
        else{
            text += "\t<@"+String(reactor.id)+">\n";
            againstIt += 1;
        }
    });
    if(againstIt === 0) text += "\tNone\n";
    //console.log(likedReacts);
    //let inFavor = message.reactions.cache.get('👍').count;
    //let against = message.reactions.cache.get('👎').count;

    return [inFavorIt,againstIt,text];
}


function execRemRole(message){
    let member = message.mentions.members.first();
    let role = message.mentions.roles.first();
    message.channel.send(role.toString()+" role was taken from "+member.toString()+".")
    member.roles.remove(role).catch(console.error);

    return;
}

function execAddRole(message){
    let member = message.mentions.members.first();
    let role = message.mentions.roles.first();
    message.channel.send(role.toString()+" role was given to "+member.toString()+".")
    member.roles.add(role).catch(console.error);

    return;
}

function execKick(message){
    let member = message.mentions.members.first();
    message.channel.send(member.toString()+" is now kicked.");
    member.kick();

    return;
}

function execBan(message){
    let member = message.mentions.members.first();
    message.channel.send(member.toString()+" is now baned.");
    member.ban();

    return;
}
function validateMotion(message){
    message.lineReplyNoMention("***Votation closed***");
    let motionResults = pollResut(message);
    let resultText = "By **"+String(motionResults[0])+"** vote"+(motionResults[0] === 1 ? "" : "s")+" in favor, **"+String(motionResults[1])+"** against, the motion";
    if(motionResults[0] <= motionResults[1]){
        message.channel.send(resultText+" was rejected.\n"+motionResults[2]);
        return false;
    }
    else{
        message.channel.send(resultText+" passed.\n"+motionResults[2]);
        return true;
    }

}

function execChangePerm(message,arg){
    let roleId;
    try{
        roleId = message.mentions.roles.first().id;
    }
    catch(errorName){
        roleId = "default";
    }
    serversData["servers"].find(server => Number(server.guildId) === Number(message.guild.id))[arg]["permission"] = String(roleId);
    writeMsg('servers-data.json',JSON.stringify(serversData));
    message.channel.send( "Now "+(roleId==="default" ? "anyone": "just member with <@&"+String(roleId)+"> role")+" can vote in '"+arg+"' polls.");

    return;
}


function executePoll(arg){
    console.log("Executing");

    let motionValidation = validateMotion(arg[1]);
    if(motionValidation === false) return;

    switch (arg[0]){
        case "addrole":
            execAddRole(arg[1]);
            break;
        case "remrole":
            execRemRole(arg[1]);
            break;
        case "kick":
            execKick(arg[1]);
            break;
        case "ban":
            execBan(arg[1]);
            break;
        case "changeperm":
            execChangePerm(arg[1],arg[2]);
            break;
        //TODO: Warn, Mute, Deafen
    }    

}


function addRole(message,member,role){
    if(member.roles.cache.has(role.id)){
        message.channel.send(member.toString()+" already has the "+role.toString()+" role.");
    }
    else{

        message.channel.send("**Votation is opened**.\n\n\t**Proposition**: Give "+role.toString()+" role to "+member.toString()+"\n\n\t**In favor**: :thumbsup:\n\n\t**Against**: :thumbsdown:\n\n\t**Votation ends in two minutes**").then(messageObj =>{
            setTimeout(executePoll,serversData["servers"].find(server => Number(server.guildId) === Number(message.guild.id))['addrole']['waittime'],['addrole',messageObj]);
            neutralReact(String(message.channel.id),String(messageObj.id));
        });
    }
    return;
}
function remRole(message,member,role){
    if(!member.roles.cache.has(role.id)){
        message.channel.send(member.toString()+" already doesn't have the "+role.toString()+" role.");
    }
    else{
        message.channel.send("**Votation is opened**.\n\n\t**Proposition**: Remove "+role.toString()+" role from "+member.toString()+"\n\n\t**In favor**: :thumbsup:\n\n\t**Against**: :thumbsdown:\n\n\t**Votation ends in two minutes**").then(messageObj =>{
            setTimeout(executePoll,serversData["servers"].find(server => Number(server.guildId) === Number(message.guild.id))['remrole']['waittime'],['remrole',messageObj]);
            neutralReact(String(message.channel.id),String(messageObj.id));
        });
    }
    return;
}
function addRemRole(message,command,args){
    if(!message.guild.me.hasPermission("MANAGE_ROLES_OR_PERMISSIONS")){
        message.channel.send("I can't manage roles or permissions.");
        return;
    } 
    let member = message.mentions.members.first();
    let role = message.mentions.roles.first();
    if(getUserMaxRolePos(message.guild.me) <= getUserMaxRolePos(member)){
        message.channel.send("My permission is not higher than "+member.toString()+".");
        return;
    }
    if(args.length !== 2){
        message.channel.send("Wrong number of arguments.");
        return;
    }
    if(member === undefined || role === undefined){
        let errorText = "";
        if(member === undefined){
            errorText += "Member not quoted.\n";
        }
        if(role === undefined){
            errorText += "Role not quoted.";
        }
        message.channel.send(errorText);
        return;
    }
    if(command === "addrole") addRole(message,member,role);
    else remRole(message,member,role);

    return;
}

function kickMember(message,args){
    if(!message.guild.me.hasPermission("KICK_MEMBERS")){
        message.channel.send("I can't kick members.");
        return;
    }
    let member = message.mentions.members.first();
    if(getUserMaxRolePos(message.guild.me) <= getUserMaxRolePos(member)){
        message.channel.send("My permission is not higher than "+member.toString()+".");
        return;
    }
    if(args.length !== 1){
        message.channel.send("Wrong number of arguments.");
        return;
    }
    if(member === undefined){
        message.channel.send("Member not quoted.");
        return;
    }


    message.channel.send("**Votation is opened**.\n\n\t**Proposition**: Kick "+member.toString()+" from server\n\n\t**In favor**: :thumbsup:\n\n\t**Against**: :thumbsdown:\n\n\t**Votation ends in two minutes**").then(messageObj =>{
        setTimeout(executePoll,serversData["servers"].find(server => Number(server.guildId) === Number(message.guild.id))['kick']['waittime'],['kick',messageObj]);
        neutralReact(String(message.channel.id),String(messageObj.id));
    });

    return;
}

function banMember(message,args){
    if(!message.guild.me.hasPermission("BAN_MEMBERS")){
        message.channel.send("I can't ban members.");
        return;
    }
    let member = message.mentions.members.first();
    if(getUserMaxRolePos(message.guild.me) <= getUserMaxRolePos(member)){
        message.channel.send("My permission is not higher than "+member.toString()+".");
        return;
    }
    if(args.length !== 1){
        message.channel.send("Wrong number of arguments.");
        return;
    }
    if(member === undefined){
        message.channel.send("Member not quoted.");
        return;
    }


    message.channel.send("**Votation is opened**.\n\n\t**Proposition**: Ban "+member.toString()+" from server\n\n\t**In favor**: :thumbsup:\n\n\t**Against**: :thumbsdown:\n\n\t**Votation ends in two minutes**").then(messageObj =>{
        setTimeout(executePoll,serversData["servers"].find(server => Number(server.guildId) === Number(message.guild.id))['ban']['waittime'],['ban',messageObj]);
        neutralReact(String(message.channel.id),String(messageObj.id));
    });

    return;
}

function neutralReact(channelId,messageId){
    let channel = client.channels.cache.get(channelId);
    channel.messages.fetch(messageId).then(messageObj =>{
        console.log("full msg: ",messageObj.content);
		messageObj.react('👍').then(() => messageObj.react('👎'))
    });
}


function changePermission(message,args){
    if(args.length > 2 || args.length < 1){
        message.channel.send("Wrong number of arguments.");
        return;
    }
    let permissionChanged;
    let permission;
    let propositionText;
    if(args.length === 2){
        let role = message.mentions.roles.first();
        if(role === undefined){
            message.channel.send("Role not quoted.");
            return;    
        }
        permission = role.id;
        propositionText = "Just members with "+role.toString()+" can vote - base constraints still apply."
    }
    else{
        permission = "default"
        propositionText = "Anyone can vote - base constraints still apply.";
    }
    if(!existingFuncs.includes(args[0])){
        message.channel.send("Not valid param.");
        return;    
    }

    message.channel.send("**Votation is opened**.\n\n\t**Proposition**: "+propositionText+"\n\n\t**In favor**: :thumbsup:\n\n\t**Against**: :thumbsdown:\n\n\t**Votation ends in two minutes**").then(messageObj =>{
        setTimeout(executePoll,serversData["servers"].find(server => Number(server.guildId) === Number(message.guild.id))['changeperm']['waittime'],['changeperm',messageObj,args[0]]);
        neutralReact(String(message.channel.id),String(messageObj.id));
    });

}




client.on('ready', () => {
    console.log('Connected and ready.');





    //console.log("bot id",client.user.id);
});

client.on('guildCreate', guild => {
    console.log("Joined a new guild: " + guild.id);
    addServer(guild);
    //Your other stuff like adding to guildArray
});


client.on("message", function(message) {
    if (message.author.bot) return;
    let text = message.content.replace(/ +(?= )/g,'').trim();
    if (!message.content.startsWith(prefix)) return;
    const commandBody = text.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    switch (command){
        case "roles":
            rolesList(message);
            break;
        case "fiu":
            message.channel.send("Fiu!");
            break;
        case "addrole":
            addRemRole(message,command,args);
            break;
        case "remrole":
            addRemRole(message,command,args);
            break;
        case "kick":
            kickMember(message,args);
            break;
        case "ban":
            banMember(message,args);
            break;
        case "changeperm":
            changePermission(message,args);
            break;
        //TODO: Warn, Mute, Deafen
    }    
});
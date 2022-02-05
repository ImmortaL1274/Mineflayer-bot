const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals: { GoalFollow, GoalNear, GoalGetToBlock, GoalY, GoalXZ, GoalBlock} } = require('mineflayer-pathfinder');
const collectBlock = require('mineflayer-collectblock').plugin;
const viewer = require('prismarine-viewer').mineflayer
const pvp = require('mineflayer-pvp').plugin;
const autoeat = require('mineflayer-auto-eat')
const { Vec3 } = require('vec3')

const playerUsername = 'ImmortaL';

const bot = mineflayer.createBot({
  //host: 'pvpn69.aternos.me', // ip fiell ok?
  port: '28357',
  username: 'ImmortaLSlave', // and username
  // password: '', // 
});

let following = false;
let follow = '';
let muted = false;
let grabbing = false;
let collecting = false;
let attacking = false;
let wandering = false;
const RANGE_GOAL = 1;

bot.loadPlugin(pathfinder);
bot.loadPlugin(collectBlock);
bot.loadPlugin(pvp);
bot.loadPlugin(autoeat)
bot.once('spawn', () => {
	const mcData = require('minecraft-data')(bot.version);
	const defaultMove = new Movements(bot, mcData);
	bot.autoEat.options = {
    priority: 'foodPoints',
    startAt: 14,
    bannedFood: []
  }
    


	viewer(bot, { port: 3007, firstPerson: false })
	bot.on('chat', (username, message) => {
		const args = message.toLowerCase().split(' ');
		if (username === bot.username) return;
		if (username === "ImmortaL") {
			if (message.toLowerCase().includes('immortalslave') && !args[0].toLowerCase() === 'immortalslave') {
				if (muted !== true) bot.chat("Yes, sir?")
			}
			if (args[1] === 'come') {
				const target = bot.players[username]?.entity
				if (!target) {
					if (muted !== true) bot.chat("You're too far."); return;
				}
				const { x: playerX, y: playerY, z: playerZ } = target.position;
				bot.pathfinder.setMovements(defaultMove);
				bot.pathfinder.setGoal(new GoalNear(playerX, playerY, playerZ, RANGE_GOAL));
			};
			if (args[1] === 'stop') {
				following = false;
				follow = '';
				const target = bot.players[bot.username]?.entity
				const { x: playerX, y: playerY, z: playerZ } = target.position
				bot.pathfinder.setMovements(defaultMove)
				bot.pathfinder.setGoal(new GoalBlock(playerX, playerY, playerZ, RANGE_GOAL));
				}
				  if (username === bot.username) return
                  switch (message) {
                   case 'sleep':
                   goToSleep()
                  break
                   case 'wakeup':
                      wakeUp()
      
			}
			if (args[1] === 'leave' || args[1] === 'quit') {
				if (muted !== true) bot.chat("I am leaving, sir.");
				bot.quit();
			}
			if (args[1] === 'mute') {
				bot.chat("o_o")
				muted = true;
			}
			if (args[1] === 'unmute') {
				if (muted !== true) bot.chat("Okay, sir.");
				muted = false;
			}
			if (args[1] === 'craft') {					
				craftItem(args[2], args[3]);
			}	
			if (args[1] === 'throw') {                    
                dropItem(args[2], args[3]);
			}
			if (args[1] === 'use') {                    
                bot.activateItem()
            }
            if (args[1] === 'equip') {                    
                equipItem(args[2], args[3]);
            }
            if (args[1] === 'unequip') {                    
                unequipItem(args[2], args[3]);
            }
			if (args[1] === 'get') {
				const blockType = mcData.blocksByName[args[2]]

				if (!blockType) {
					bot.chat("Hm?");
					return;
				}

				bot.chat('Getting the nearest ' + blockType.name)
				const block = bot.findBlock({
					matching: blockType.id,
					maxDistance: 64
				})

				if (!block) {
					bot.chat("I don't see that block nearby.")
					return
				}

				bot.collectBlock.collect(block, err => {
					if (err) bot.chat(err.message)
				})
                if (args[1] === 'attack') {
				stop(defaultMove);
				const target = bot.players[args[2]]?.entity;
				if (muted !== true) if (!target) { bot.chat('No target found') } else bot.chat("Okay, sir.");
				bot.pvp.attack(target);
            }
            }
			if (args[1] === 'follow') {
                following = true;
                follow = username;
                const target = bot.players[username]?.entity
                if (!target) {
                    if (muted !== true) bot.chat("You're too far."); return;
                }
                const { x: playerX, y: playerY, z: playerZ } = target.position;
                bot.pathfinder.setMovements(defaultMove);
                bot.pathfinder.setGoal(new GoalBlock(playerX, playerY, playerZ));
                bot.on('entityMoved', (entity)=>{
                    if (entity.username === follow) {
                        const { x: playerX, y: playerY, z: playerZ } = target.position;
                        bot.pathfinder.setMovements(defaultMove);
                        bot.pathfinder.setGoal(new GoalBlock(playerX, playerY, playerZ));
                    }
                });
            }
		} else {
			if (message.toLowerCase().includes('immortalslave') && !args[0].toLowerCase() === 'immortalslave') {
				if (muted !== true) bot.chat("Who are you?")
			}
		}
	});
});
bot.on('kicked', console.log);
bot.on('error', console.log);
let last_hurt_message_number = 0;
bot.on('entityHurt', (entity)=>{
	if (muted) return;
	const msg = ["Gay!", "Habibi stop!", "Stop!", "Blyat!", "Damn mate!", "Yamete Kudasai!", "Cyka blyat!"];
	if (entity.username === bot.username && bot.health !==0 ) {
		if (last_hurt_message_number > msg.length - 1) last_hurt_message_number = 0;
		bot.chat(msg[last_hurt_message_number]);
		last_hurt_message_number++;
	}
});

let last_death_message_number = 0;
let death_count = 0;
bot.on('death', ()=>{
	if (muted) return;
	const msg = ["Allahu akbar!!!"];
	if (last_death_message_number > msg.length - 1) last_death_message_number = 0;
	bot.chat(msg[last_death_message_number]);
	last_death_message_number++;
	death_count++;
});

let mcData
bot.on('inject_allowed', () => {
  mcData = require('minecraft-data')(bot.version)
})

bot.on('entityCrouch', (entity)=>{
	if (following) return;
    if (entity === bot.nearestEntity(e=>e.username !== bot.username)) {
        if (Math.floor(bot.entity.position.distanceTo(bot.nearestEntity().position)) < 7) bot.setControlState('sneak', true);
    }
})

bot.on('entityUncrouch', (entity)=>{
	if (following) return;
    if (entity === bot.nearestEntity(e=>e.username !== bot.username)) {
        if (Math.floor(bot.entity.position.distanceTo(bot.nearestEntity().position)) < 7) bot.setControlState('sneak', false);
    }
})

bot.on('physicTick', ()=>{
    if (bot.pathfinder.isMoving() || bot.pathfinder.isBuilding() || bot.pathfinder.isMining()) return;
    if (!bot.nearestEntity()) return;
    let pos = bot.nearestEntity().position.offset(0, bot.nearestEntity().height, 0);
    if (Math.floor(bot.entity.position.distanceTo(bot.nearestEntity().position)) < 10) bot.lookAt(pos);
});

bot.on('sleep', () => {
  bot.chat('Good night!')
})
bot.on('wake', () => {
  bot.chat('Good morning!')
})

bot.on('message', (cm) => {
  if (cm.toString().includes('complete')) {
    const message = cm.toString()
    const str = cm.toString().slice(message.indexOf('complete') + 9)
    complete(str)
  }
})

async function complete (str) {
  try {
    const matches = await bot.tabComplete(str)
    console.log(str, matches)
    bot.chat(`Matches for "${str}": ${matches.join(', ')}`)
  } catch (err) {
    bot.chat(err.message)
  }
}

async function goToSleep () {
  const bed = bot.findBlock({
    matching: block => bot.isABed(block)
  })
  if (bed) {
    try {
      await bot.sleep(bed)
      bot.chat("I'm sleeping")
    } catch (err) {
      bot.chat(`I can't sleep: ${err.message}`)
    }
  } else {
    bot.chat('No nearby bed')
  }
}

async function wakeUp () {
  try {
    await bot.wake()
  } catch (err) {
    bot.chat(`I can't wake up: ${err.message}`)
  }
}

async function equipItem (name, destination) {
    const item = itemByName(name)
    if (item) {
        try {
            await bot.equip(item, destination)
            bot.chat(`Equipped ${name}.`)
        } catch (err) {
            bot.chat(`I can't equip ${name}!`)
            bot.log(err.message);
        }
    } else {
        bot.chat(`I have no ${name}.`)
    }
}

async function craftItem (name, amount) {
	amount = parseInt(amount, 10)
	const mcData = require('minecraft-data')(bot.version)
 
	const item = mcData.findItemOrBlockByName(name)
	const craftingTableID = mcData.blocksByName.crafting_table.id
 
	const craftingTable = bot.findBlock({
	  matching: craftingTableID
	})

	if (item) {
	  const recipe = bot.recipesFor(item.id, null, 1, craftingTable)[0]
	  if (recipe) {
		bot.chat(`I can craft ${name}.`)
		try {
		  await bot.craft(recipe, amount, craftingTable)
		  bot.chat(`I crafted ${name} ${amount} times.`)
		} catch (err) {
		  bot.chat(`I can't seem to craft ${name}.`)
		}

		} else {
			bot.chat(`I cannot craft ${name}!`)
		}
	} else {
	  bot.chat(`What's ${name}?`)
	}
} 

function itemToString (item) {
	if (item) {
		return `${item.name} x ${item.count}`;
	} else {
		return 'None';
	}
}
  
function itemByName (name) {
	return bot.inventory.items().filter(item => item.name === name)[0]
}

function stop(defaultMove) {
	grabbing = false;
	following = false;
	collecting = false;
	attacking = false;
	wandering = false;
	attack = '';
	follow = '';
	bot.pvp.stop();
	const target = bot.players[bot.username]?.entity
	const { x: playerX, y: playerY, z: playerZ } = target.position
	bot.pathfinder.setMovements(defaultMove);
	bot.pathfinder.setGoal(new GoalNear(playerX, playerY, playerZ, RANGE_GOAL));
}

let amount;
let name;
function dropItem (name, amount) {
    amount = parseInt(amount, 10)
    const item = itemByName(name)
    if (!item) {
        bot.chat(`I have no ${name}.`)
    } else if (amount) {
        bot.toss(item.type, null, amount, checkIfDropped)
    } else {
        bot.tossStack(item, checkIfDropped)
    }
}

function checkIfDropped (err) {
    if (err) {
    bot.chat(`Unable to throw item.`)
    console.log(err.message);
    } else if (amount > 1) {
        bot.chat(`I dropped ${amount} of ${name}.`)
    } else {
    bot.chat(`Dropped ${name}.`)
    }
}

bot.on('autoeat_started', () => {
  console.log('Auto Eat started!')
})

bot.on('autoeat_stopped', () => {
  console.log('Auto Eat stopped!')
})

bot.on('health', () => {
  if (bot.food === 20) bot.autoEat.disable()
  // Disable the plugin if the bot is at 20 food points
  else bot.autoEat.enable() // Else enable the plugin again
})

bot.on('startedAttacking', () => {
    const sword = bot.inventory.items().find(item => item.name.includes('sword, axe'))
    if (sword) bot.equip(sword, 'hand')
});

function blockToSow () {
  return bot.findBlock({
    point: bot.entity.position,
    matching: mcData.blocksByName.farmland.id,
    maxDistance: 6,
    useExtraInfo: (block) => {
      const blockAbove = bot.blockAt(block.position.offset(0, 1, 0))
      return !blockAbove || blockAbove.type === 0
    }
  })
}


function blockToHarvest () {
  return bot.findBlock({
    point: bot.entity.position,
    maxDistance: 6,
    matching: (block) => {
      return block && block.type === mcData.blocksByName.wheat.id && block.metadata === 7
    }
  })
}

async function loop () {
  try {
    while (1) {
      const toHarvest = blockToHarvest()
      if (toHarvest) {
        await bot.dig(toHarvest)
      } else {
        break
      }
    }
	
	 while (1) {
      const toSow = blockToSow()
      if (toSow) {
        await bot.equip(mcData.itemsByName.wheat_seeds.id, 'hand')
        await bot.placeBlock(toSow, new Vec3(0, 1, 0))
      } else {
        break
      }
    }
  } catch (e) {
    console.log(e)
  }
  
   setTimeout(loop, 1000)
}

bot.once('login', loop)

bot.on('message', (cm) => {
  if (cm.toString().includes('start')) {
    startFishing()
  }

  if (cm.toString().includes('stop')) {
    stopFishing()
  }

  if (cm.toString().includes('eat')) {
    eat()
  }
})

let nowFishing = false

function onCollect (player, entity) {
  if (entity.kind === 'Drops' && player === bot.entity) {
    bot.removeListener('playerCollect', onCollect)
    startFishing()
  }
}

async function startFishing () {
  bot.chat('Fishing')
  try {
    await bot.equip(mcData.itemsByName.fishing_rod.id, 'hand')
  } catch (err) {
    return bot.chat(err.message)
  }
  
  nowFishing = true
  bot.on('playerCollect', onCollect)

 try {
    await bot.fish()
  } catch (err) {
    bot.chat(err.message)
  }
  nowFishing = false
}

function stopFishing () {
  bot.removeListener('playerCollect', onCollect)

  if (nowFishing) {
    bot.activateItem()
  }
}

async function eat () {
  stopFishing()
  
    try {
    await bot.equip(mcData.itemsByName.fish.id, 'hand')
  } catch (err) {
    return bot.chat(err.message)
  }
  
  try {
    await bot.consume()
  } catch (err) {
    return bot.chat(err.message)
  }
}
bot.on('entityMoved', (entity)=>{
  if (bot.entity.position.distanceTo(bot.nearestEntity(e=>e.kind == 'Hostile mobs').position) < 10) {
      bot.pvp.attack(bot.nearestEntity(e=>e.kind == 'Hostile mobs'));
  }
});

bot.on('entityHurt', (entity)=>{
  if (entity.username !== bot.username) return;
  console.log(bot.nearestEntity())
  if (bot.nearestEntity().username === playerUsername) {
    bot.chat('why u bully me?');
  } else {
    if (!bot.pathfinder.isMoving()) bot.pvp.attack(bot.nearestEntity());
  }
});

bot.on('startedBuilding', () => {
    const dirt = bot.inventory.items().find(item => item.name.includes('dirt'))
    if (dirt) bot.equip(dirt, 'hand')
});

bot.on('startedMining', () => {
    const pickaxe = bot.inventory.items().find(item => item.name.includes('pickaxe'))
    if (pickaxe) bot.equip(pickaxe, 'hand')
});

bot.on('startedDigging', () => {
    const shovel = bot.inventory.items().find(item => item.name.includes('shovel'))
    if (shovel) bot.equip(shovel, 'hand')
});
import DSA5 from "./config-dsa5.js"
import DSA5_Utility from "./utility-dsa5.js"

export default class DSA5ChatListeners {
    static chatListeners(html) {
        html.on('click', '.chat-condition', ev => {
            DSA5ChatListeners.postStatus($(ev.currentTarget).attr("data-id"))
        })
    }

    static postStatus(id) {
        let effect = CONFIG.statusEffects.find(x => x.id == id)
        let msg = `<h2><img class="sender-image" style="background-color:black;margin-right: 8px;" src="${effect.icon}"/>${game.i18n.localize(effect.label)}</h2><p>${game.i18n.localize(effect.description)}</p>`
        ChatMessage.create(DSA5_Utility.chatDataSetup(msg, "roll"))
    }

    static getHelp() {
            let msg = DSA5.helpContent.map(x => `<h2>${game.i18n.localize(`HELP.${x.name}`)}</h2><p><b>${game.i18n.localize("HELP.command")}</b>: ${x.command}</p><p><b>${game.i18n.localize("HELP.example")}</b>: ${x.example}</p><p><b>${game.i18n.localize("Description")}</b>: ${game.i18n.localize(`HELP.descr${x.name}`)}`).join("") + `<br><p>${game.i18n.localize("HELP.default")}</p>`
        ChatMessage.create(DSA5_Utility.chatDataSetup(msg, "roll"))
    }

    static showConditions(){
        let msg = CONFIG.statusEffects.map(x => `<a class="chat-condition chatButton" data-id="${x.id}"><img src="${x.icon}"/>${game.i18n.localize(x.label)}</a>`).join(" ")
        ChatMessage.create(DSA5_Utility.chatDataSetup(msg, "roll"))
    }

    static showTables(){
        let msg = `<a class="roll-button defense-botch" data-weaponless="false"><i class="fas fa-dice"></i>${game.i18n.localize('TABLENAMES.Defense')}</a>
        <a class="roll-button melee-botch" data-weaponless="false"><i class="fas fa-dice"></i>${game.i18n.localize('TABLENAMES.Melee')}</a>
        <a class="roll-button range-botch" data-weaponless="false"><i class="fas fa-dice"></i>${game.i18n.localize('TABLENAMES.Range')}</a>
        <a class="roll-button liturgy-botch"><i class="fas fa-dice"></i>${game.i18n.localize('TABLENAMES.Liturgy')}</a>
        <a class="roll-button spell-botch"><i class="fas fa-dice"></i>${game.i18n.localize('TABLENAMES.Spell')}</a>`
        ChatMessage.create(DSA5_Utility.chatDataSetup(msg, "roll"))
    }
}
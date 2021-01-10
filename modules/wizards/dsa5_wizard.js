import AdvantageRulesDSA5 from "../system/advantage-rules-dsa5.js"
import DSA5 from "../system/config-dsa5.js"
import ItemRulesDSA5 from "../system/item-rules-dsa5.js"
import SpecialabilityRulesDSA5 from "../system/specialability-rules-dsa5.js"
import DSA5_Utility from "../system/utility-dsa5.js"

export default class WizardDSA5 extends Application {
    constructor(app) {
        super(app)
        this.items = []
        this.actor = null
        this.errors = []
        this.dataTypes = []
        this.attributes = []
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.tabs = [{ navSelector: ".tabs", contentSelector: ".content", initial: "description" }]
        mergeObject(options, {
            classes: options.classes.concat(["dsa5", "largeDialog"]),
            width: 770,
            height: 740,
        });
        options.resizable = true
        return options;
    }

    parseToItem(value, types) {
        if (value.trim() == "")
            return []

        return value.split(", ").map(x => {
            let parsed = DSA5_Utility.parseAbilityString(x.trim())
            let item = this.items.find(y => y.name == parsed.original && types.includes(y.type))
            if (!item) {
                item = this.items.find(y => y.name == parsed.name && types.includes(y.type))
            }
            if (!item) {
                if (this.attributes.includes(parsed.name)) {
                    let cost = 0
                    for (let i = this.actor.data.data.characteristics[parsed.name.toLowerCase()].value + 1; i < parsed.step + 1; i++) {
                        cost += DSA5.advancementCosts.E[i]
                    }
                    item = {
                        name: parsed.name,
                        step: parsed.step,
                        attributeRequirement: true,
                        data: {
                            APValue: {
                                value: cost
                            }
                        }
                    }
                } else {
                    console.warn(`Not found <${x}>`)
                    this.errors.push(`${types.map(x => game.i18n.localize(x)).join("/")}: ${x}`)
                    item = {
                        name: x.trim(),
                        notFound: true,
                        tooltip: game.i18n.localize('Error.itemNotFound'),
                        apCost: "?"
                    }
                }
            } else {
                item = duplicate(item)
                item.tooltip = game.i18n.localize("Details")
                item = ItemRulesDSA5.reverseAdoptionCalculation(this.actor, parsed, item)
                if (item.data.APValue) {
                    item.APunparseable = isNaN(item.data.APValue.value)
                    item.apCost = item.APunparseable ? item.data.APValue.value : parsed.step * Number(item.data.APValue.value)
                }
            }
            item.replaceName = parsed.original
            item.step = parsed.step
            let actorHasItem = this.actor.data.items.find(y => types.includes(y.type) && y.name == parsed.original) != undefined
            item.disabled = actorHasItem || item.notFound || item.APunparseable
            if (actorHasItem)
                item.tooltip = game.i18n.localize("YouAlreadyHaveit")
            return item
        })
    }

    async addSelections(elems) {
        for (let k of elems) {
            let item = duplicate(this.items.find(x => x._id == $(k).val()))
            item.name = $(k).attr("name")

            switch (item.type) {
                case "advantage":
                case "disadvantage":
                    item.data.step.value = Number($(k).attr("data-step"))
                    item.data.APValue.value = Number($(k).attr("data-cost"))
                    await this.actor.createEmbeddedEntity("OwnedItem", item)
                    AdvantageRulesDSA5.vantageAdded(this.actor, item)
                    break
                case "specialability":
                    item.data.step.value = Number($(k).attr("data-step"))
                    item.data.APValue.value = Number($(k).attr("data-cost"))
                    await this.actor.createEmbeddedEntity("OwnedItem", item)
                    SpecialabilityRulesDSA5.abilityAdded(this.actor, item)
                    break
                case "magictrick":
                    await this.actor.createEmbeddedEntity("OwnedItem", item)
                    break
            }
        }
    }

    async updateSkill(skill, itemType) {
        let parsed = DSA5_Utility.parseAbilityString(skill.trim())
        let res = this.actor.data.items.find(i => {
            return i.type == itemType && i.name == parsed.name
        });
        if (res) {
            let skillUpdate = duplicate(res)
            skillUpdate.data.talentValue.value = parsed.step + (parsed.bonus ? Number(skillUpdate.data.talentValue.value) : 0)
            await this.actor.updateEmbeddedEntity("OwnedItem", skillUpdate);
        } else {
            console.warn(`Could not find ${itemType} ${skill}`)
            this.errors.push(`${game.i18n.localize(itemType)}: ${skill}`)
        }
    }

    async _loadCompendiae() {
        this.items = [];
        for (let p of game.packs) {
            if (p.metadata.entity == "Item" && (game.user.isGM || !p.private)) {
                await p.getContent().then(content => {
                    this.items = this.items.concat(content.filter(x => this.dataTypes.includes(x.type)))
                })
            }
        }
        this.items.concat(game.items.entities.filter(i => i.permission > 1 && this.dataTypes.includes(i.type)));
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('button.ok').click(ev => {
            this.updateCharacter()
        })
        html.find('button.cancel').click(ev => {
            this.close()
        })
        html.find('.show-item').click(ev => {
            let itemId = $(ev.currentTarget).attr("data-id")
            const item = this.items.find(i => i.data._id == itemId)
            item.sheet.render(true)
        })
    }

    finalizeUpdate() {
        if (this.errors.length == 0) {
            this.close()
        } else {
            parent.find('.dialog-buttons').html(`<div class="error"><p>${game.i18n.localize('Error.notUnderstoodCulture')}</p><ul><li>${this.errors.join("</li><li>")}</li></ul></div>`)
        }
    }
}
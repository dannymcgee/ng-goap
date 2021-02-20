import { Component, OnInit } from '@angular/core'

import { cloneDeep } from 'lodash'

import { IAction, IAgent, IGoal, IState } from '@goap/types'
import { Planner } from '@goap/planner'

class BeFull implements IGoal {
	name = 'BeFull'
	hunger = 0
	estimateValue(state: Readonly<IState>, action: IAction): number {
		let result = action.simulate(state)
		return Math.min(state.hunger, (result.hunger - state.hunger) * -1)
	}
	isSatisfiedBy(state: IState): boolean {
		return state.hunger === this.hunger
	}
}

class EatPizza implements IAction {
	cost = 1
	name = 'EatPizza'
	isValidFor(state: IState): boolean {
		return state.pizza.isEdible
	}
	simulate(state: Readonly<IState>): IState {
		let result: IState = cloneDeep(state)
		let consumed = Math.min(state.hunger, Math.min(35, state.pizza.calories))

		result.pizza.calories -= consumed
		result.hunger -= consumed

		return result
	}
	toGoal(): IGoal {
		let original = this

		return new (class implements IGoal {
			name = 'HaveACookedPizza'
			estimateValue(state: Readonly<IState>, action: IAction): number {
				let result: IState = action.simulate(state)

				if (result.pizza.isEdible && !state.pizza.isEdible) return 10

				return 0
			}
			isSatisfiedBy = original.isValidFor
		})()
	}
}

class EatChips implements IAction {
	cost = 1
	name = 'EatChips'
	isValidFor(state: IState): boolean {
		return state.location === state.chips.location
	}
	simulate(state: IState): IState {
		let result = cloneDeep(state)
		let consumed = Math.min(state.hunger, Math.min(5, state.chips.calories))

		result.chips.calories -= consumed
		result.hunger -= consumed

		return result
	}
	toGoal(): IGoal {
		let original = this

		return new (class implements IGoal {
			name = 'HaveChips'
			estimateValue(state: IState, action: IAction): number {
				let result = action.simulate(state)

				if (
					state.location !== state.chips.location &&
					result.location === result.chips.location
				) {
					return 10
				}
				return 0
			}
			isSatisfiedBy = original.isValidFor
		})()
	}
}

class CookPizza implements IAction {
	cost = 5
	name = 'CookPizza'
	isValidFor(state: IState): boolean {
		return state.location === state.pizza.location && !state.pizza.isEdible
	}
	simulate(state: IState): IState {
		let result = cloneDeep(state)
		result.pizza.isEdible = true

		return result
	}
	toGoal(): IGoal {
		let original = this

		return new (class implements IGoal {
			name = 'HaveAPizza'
			estimateValue(state: IState, action: IAction): number {
				let result = action.simulate(state)

				if (
					state.location !== state.pizza.location &&
					result.location === result.pizza.location
				) {
					return 10
				}
				return 0
			}
			isSatisfiedBy = original.isValidFor
		})()
	}
}

class GoTo implements IAction {
	name: string
	get cost(): number {
		return this._location - this._state.location
	}

	constructor(private _location: number, private _state: IState) {
		this.name = `GoTo(${this._location})`
	}

	isValidFor(state: IState): boolean {
		return true
	}
	simulate(state: Readonly<IState>): IState {
		let result: IState = cloneDeep(state)
		result.location = this._location

		return result
	}
	toGoal(): IGoal {
		let original = this

		return new (class implements IGoal {
			name = 'NoOp'
			estimateValue(state: IState, action: IAction): number {
				return 0
			}
			isSatisfiedBy = original.isValidFor
		})()
	}
}

const BE_FULL = new BeFull()
const EAT_PIZZA = new EatPizza()
const EAT_CHIPS = new EatChips()
const COOK_PIZZA = new CookPizza()

@Component({
	selector: 'goap-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	providers: [Planner],
})
export class AppComponent implements IAgent, OnInit {
	title = 'demo'

	get state(): Readonly<IState> {
		return this._state
	}
	private _state: IState = {
		location: 0,
		hunger: 100,
		pizza: {
			location: 10,
			isEdible: false,
			calories: 90,
		},
		chips: {
			location: 0,
			calories: 100,
		},
	}

	private _goal: IGoal = BE_FULL

	get actions(): IAction[] {
		return [
			EAT_PIZZA,
			EAT_CHIPS,
			COOK_PIZZA,
			new GoTo(this.state.pizza.location, this.state),
			new GoTo(this.state.chips.location, this.state),
		]
	}

	get tasks(): readonly IAction[] {
		return this._tasks
	}
	private _tasks: readonly IAction[] = []

	constructor(private _planner: Planner) {}

	ngOnInit(): void {
		this._planner
			.initialize(this)
			.run(this._goal)
			.subscribe((plan) => {
				if (!plan) {
					return console.log(`No plan found!`)
				}
				this._tasks = plan
			})
	}
}

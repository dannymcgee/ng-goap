import { cloneDeep } from 'lodash'
import { BehaviorSubject, Observable } from 'rxjs'

import { IAction, IAgent, IGoal, IPlanner, IState } from '@goap/types'
import { Injectable } from '@angular/core'

@Injectable()
export class Planner implements IPlanner {
	private _plan$ = new BehaviorSubject<IAction[] | null>(null)
	private _agent?: IAgent

	constructor() {}

	initialize(agent: IAgent): Planner {
		this._agent = agent

		return this
	}

	run(goal: Readonly<IGoal>): Observable<IAction[] | null> {
		if (!this._agent) throw new Error('Expected planner to be initialized before run')

		console.log('')
		console.log('======================= RUN =======================')
		console.log('')
		new Plan(this._agent, goal).then((plan) => this._plan$.next(plan))

		return this._plan$
	}
}

class Plan extends Array<IAction> {
	private _specState: IState
	private _agent: IAgent
	private get _actions(): readonly IAction[] {
		return this._agent.actions
	}

	private _onDone?: (plan: IAction[] | null) => void
	private _onError?: (err: Error) => void

	constructor(agent: IAgent, goal: IGoal) {
		super()

		this._agent = agent
		this._specState = cloneDeep(agent.state)

		console.log('START:', cloneDeep(this._specState))
		setTimeout(() => {
			try {
				this._buildGraph(goal)
			} catch (err) {
				if (this._onError) return this._onError(err)
				throw err
			}
		})
	}

	then(onDone?: (plan: IAction[] | null) => void, onError?: (err: Error) => void): this {
		this._onDone = onDone
		this._onError = onError

		return this
	}

	catch(handler: (err: Error) => void): this {
		this._onError = handler

		return this
	}

	private _buildGraph(goal: IGoal): void {
		let i = 0

		while (i < 1000) {
			console.log(`[${i}]: Selecting action for goal '${goal?.name ?? 'WTF'}'`)

			let nextAction = this._selectActionFor(goal)
			console.log('=============================================')
			console.log(nextAction?.name)
			this._specState = nextAction.simulate(this._specState)
			console.log('    Result:', cloneDeep(this._specState))
			console.log('=============================================')

			if (!nextAction) {
				return this._onDone?.(null)
			}

			this.unshift(nextAction)

			if (nextAction.isValidFor(this._specState)) {
				console.log('')
				console.log('PLANNING DONE --------------------------------------')
				console.log(
					'    ' +
						Array.from(this)
							.map((action) => action.name)
							.join(' -> ')
				)
				console.log('----------------------------------------------------')
				console.log('')
				return this._onDone?.(Array.from(this))
			}

			goal = nextAction.toGoal()
			if (!goal) {
				throw new Error(
					`Expected action with prerequsites (` +
						nextAction.name +
						`) to implement conversion to goal`
				)
			}

			++i
		}
	}

	private _selectActionFor(goal: IGoal): IAction {
		let values = this._actions.map((action) => {
			console.log(`  ${action.name} ------------------------`)
			let benefit = goal.estimateValue(this._specState, action)
			let val = benefit - action.cost
			console.log('      Benefit:', goal.estimateValue(this._specState, action))
			console.log('      Cost:', action.cost)
			console.log('    RESULT:', val)

			return val
		})

		let best = values.reduce(max, Number.NEGATIVE_INFINITY)
		let idx = values.indexOf(best)

		if (idx === -1) throw new Error(`This should never happen, so um... whoops?`)

		return this._actions[idx]
	}
}

function max(a: number, b: number): number {
	return Math.max(a, b)
}

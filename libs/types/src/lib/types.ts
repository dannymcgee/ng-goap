import { InjectionToken } from '@angular/core'
import { Observable } from 'rxjs'

export interface IState {
	[key: string]: any
}

export interface IAction {
	name: string
	cost: number
	isValidFor(state: IState): boolean
	simulate(state: IState): IState
	toGoal(): IGoal
}

export interface IGoal {
	name: string
	estimateValue(state: IState, action: IAction): number
	isSatisfiedBy(state: IState): boolean
}

export interface IPlanner {
	initialize(agent: IAgent): IPlanner
	run(goal: Readonly<IGoal>): Observable<IAction[] | null>
}

export interface IAgent {
	readonly state: Readonly<IState>
	// goal: Readonly<IGoal>
	readonly actions: readonly IAction[]
}

// export const AGENT = new InjectionToken<IAgent>('IAgent DI token')

import { Observable } from 'rxjs'

export interface State {
	[key: string]: any
}

export interface Action {
	cost: number
	isValid(state: State): boolean
	simulate(state: State): State
}

export interface Goal extends State {
	estimate(given: State, action: Action): number
}

export interface Planner {
	goal: Goal
	actions: Action[]
	run(): Observable<Action[]>
}

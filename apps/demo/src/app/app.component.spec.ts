import { Spectator, createComponentFactory } from '@ngneat/spectator/jest'
import { AppComponent } from './app.component'

describe('AppComponent', () => {
	let spectator: Spectator<AppComponent>
	let app: AppComponent
	let element: HTMLElement
	let $: Spectator<AppComponent>['query']
	let $$: Spectator<AppComponent>['queryAll']

	const createComponent = createComponentFactory({
		component: AppComponent,
	})

	beforeEach(async () => {
		spectator = createComponent()

		app = spectator.component
		element = spectator.element
		$ = spectator.query.bind(spectator)
		$$ = spectator.queryAll.bind(spectator)
	})

	it('should create the app', () => {
		expect(app).toExist()
	})

	it(`should have as title 'demo'`, () => {
		expect(app.title).toEqual('demo')
	})

	it('should render title', () => {
		expect($('h1')).toHaveText('Welcome to demo!')
	})
})

/** A step of a page's procedure, the `<Step>` of its first `<Steps>`: what its `HowTo` structured data lists. */
export interface DocStep {
	name: string;
	text: string;
	/** The page that does the step, when it is another page: a step of a page built from code. */
	path?: string;
}

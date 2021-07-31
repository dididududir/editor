import { Tab } from './CommonTab'
import { TabSystem } from './TabSystem'
import { v4 as uuid } from 'uuid'

export abstract class FileTab extends Tab {
	public isForeignFile = false

	constructor(
		protected parent: TabSystem,
		protected fileHandle: FileSystemFileHandle
	) {
		super(parent)
	}

	async setup() {
		this.isForeignFile = false
		this.projectPath = await this.parent.projectRoot
			.resolve(this.fileHandle)
			.then((path) => path?.join('/'))

		// If the resolve above failed, we are dealing with a file which doesn't belong to this project
		if (!this.projectPath) {
			this.isForeignFile = true
			this.projectPath = `${uuid()}/${this.fileHandle.name}`
		}

		await super.setup()
	}

	get name() {
		return this.fileHandle.name
	}

	async isFor(fileHandle: FileSystemFileHandle) {
		return await fileHandle.isSameEntry(this.fileHandle)
	}

	getFile() {
		return this.fileHandle.getFile()
	}
	getFileHandle() {
		return this.fileHandle
	}

	abstract save(): void | Promise<void>
	async saveAs() {
		const fileHandle = await self
			// @ts-ignore The type package doesn't know about suggestedName yet
			.showSaveFilePicker({ suggestedName: this.fileHandle.name })
			.catch(() => null)
		if (!fileHandle) return

		// Remove tab from openedFiles list
		if (!this.isForeignFile) this.parent.openedFiles.remove(this.getPath())

		this.fileHandle = fileHandle

		this.resetSignal()

		// After updating the file handle, we need to re-setup the tab
		await this.setup()
		await this.parent.save(this)

		// Add tab with new path to openedFiles list
		if (!this.isForeignFile) this.parent.openedFiles.add(this.getPath())
	}
}
export default class TypedException extends Error {
    // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
    // Use this class instead of the classic "Error" to fix exception type assertions
    get name() {
        return this.constructor.name
    }
}

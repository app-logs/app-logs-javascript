/**
 * Determine if a value is an Object
 *
 * @param {*} thing The value to test
 *
 * @returns {boolean} True if value is an Object, otherwise false
 */
const isObject = (thing: any) => thing !== null && typeof thing === 'object';

export default {
    isObject
}

/**
 * @param {never} _value 
 */
export function exhaustiveGuard(_value) {
    throw new Error(`Error! Reached foridden guard function with unexpected value: ${JSON.stringify(_value)}`);
}

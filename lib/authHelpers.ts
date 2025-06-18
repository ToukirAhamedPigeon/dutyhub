// This function checks if the user has **all** of the required permissions
export const authUserCanAll = (permissions: string[], required: string[]) =>
    // It uses `Array.prototype.every()` to ensure each item in `required` exists in `permissions`
    required.every(key => permissions.includes(key));
  
// This function checks if the user has **at least one** of the required permissions
export const authUserCanAny = (permissions: string[], required: string[]) =>
    // It uses `Array.prototype.some()` to check if any item in `required` exists in `permissions`
    required.some(key => permissions.includes(key));
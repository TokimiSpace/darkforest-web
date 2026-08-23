// @ts-check

// Source-tree shim for type checking. The client emitter places the generated runtime beside the
// emitted browser files, so the same relative import resolves in both source and static output.
export { parseServerMessage } from "../../../packages/protocol/src/runtime.js";

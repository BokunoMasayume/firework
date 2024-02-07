export type BufferState = {
    buffer: WebGLBuffer;
    location: number;
    numComponent: number;
};

export type TransformFeedbackState = {
    transformVa: WebGLVertexArrayObject;
    renderVa: WebGLVertexArrayObject;
    tf: WebGLTransformFeedback;
}
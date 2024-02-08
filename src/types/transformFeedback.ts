export type BufferState = {
    buffer: WebGLBuffer;
    location: number;
    numComponent: number;
};

export type TransformFeedbackState = {
    id: number;

    transformVa: WebGLVertexArrayObject;
    renderVa: WebGLVertexArrayObject;
    tf: WebGLTransformFeedback;
}
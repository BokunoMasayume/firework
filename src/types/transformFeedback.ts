export type BufferStatus = {
    buffer: WebGLBuffer;
    location: number;
    numComponent: number;
};

export type TransformFeedbackStatus = {
    id: number;

    transformVa: WebGLVertexArrayObject;
    renderVa: WebGLVertexArrayObject;
    tf: WebGLTransformFeedback;
}
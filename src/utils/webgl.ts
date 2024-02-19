export type WebGLContext = WebGL2RenderingContext;

export function createShader(gl: WebGLContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
        // return shader;
        throw new Error('创建shader失败');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.error(type == gl.FRAGMENT_SHADER ? 'frag' : 'vert', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return shader;
}

export function createProgram(gl: WebGLContext, vertexShader: WebGLShader, fragmentShader: WebGLShader, transformFeedbackVaryings?: string[]) {
    const program = gl.createProgram();
    if (!program || !vertexShader || !fragmentShader) return program;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    if (transformFeedbackVaryings) {
        gl.transformFeedbackVaryings(program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS);
    }

    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.warn(gl.getProgramInfoLog(program));

    gl.deleteProgram(program);

    return program;
}

export function getUniforms(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
): { [name: string]: WebGLUniformLocation | null } {
    const uniforms: { [name: string]: WebGLUniformLocation | null } = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    console.log('uniformcount', uniformCount)
    for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i)!.name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
}

export function getAttribs(gl: WebGLRenderingContext, program: WebGLProgram): { [name: string]: number } {
    const attribs: { [name: string]: number } = {};
    const attribCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attribCount; i++) {
        let attribName = gl.getActiveAttrib(program, i)!.name;
        attribs[attribName] = gl.getAttribLocation(program, attribName);
    }

    return attribs;
}

export function getParameters(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
): { [name: string]: number | WebGLUniformLocation | null } {
    const uniforms = getUniforms(gl, program);
    const attribs = getAttribs(gl, program);

    return Object.assign({}, uniforms, attribs);
}

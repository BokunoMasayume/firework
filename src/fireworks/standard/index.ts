import { FireWorkState } from "../../types/common";
import { TransformFeedbackStatus } from "../../types/transformFeedback";
import { WebGLContext, getParameters } from "../../utils/webgl";
import { BaseFirework } from "../base";

/**
 * stage 1: 
 * 大家有公共的起点， 随机有一些会掉队
 * 所以分为两个状态
 * 掉队和没掉队
 * 
 * stage 2:
 * 起始时分成两种： 聚合成员 和 独走
 * 聚合成员分为掉队的和没掉队的
 * 
 * 因此要存的东西有： 
 * 发射过程的状态 / 爆炸过程的状态 
 * 位置
 * 速度
 * 
 * 在第一阶段前需要有个初始化过程
 * 在第二阶段前需要有个初始化过程
 * 
 * 粒子的状态：
 * 1. 聚合 - 未掉队
 * 拥有一个初始的位置和速度
 * 每一个tick， 按照速度更新位置， 且可能变为聚合 - 掉队状态
 * 2. 聚合 - 掉队
 * 在切换为该状态时，可更新速度， 相比于原来的速度加个垂直的分量， 凋亡速度可以比较快
 * 3. 默认
 * 普通的
 * 
 * 单个粒子的状态集合：
 * 1. 位置 vec3
 * 2. 速度 vec3
 * 3. 生命时长 float
 * 4. 大小 float
 * 5. 状态 int（聚合-未掉队， 聚合-掉队， 默认）
 * 
 * 
 * 
 */
// export class StandardFirework extends BaseFirework {
//     numParticle = 3000;

//     transformProgram: WebGLProgram | null = null;
//     transformParameters?: ReturnType<typeof getParameters>;

//     renderProgram: WebGLProgram | null = null;
//     renderParameters?: ReturnType<typeof getParameters>;

//     currentStatus!: TransformFeedbackStatus;
//     nextStatus!: TransformFeedbackStatus;

//     matrix?: Float32Array;

//     constructor(gl: WebGLContext) {
//         super(gl);
//     }

//     init() {
//         this.state = FireWorkState.Init;

//         const { gl } = this;

//         // init programs

//         // init buffers

//     }
// }
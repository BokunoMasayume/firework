# firework

## TODO

- fireworks类型
  - 发射过程 (位置控制)
  - 文字
  - 球球  文字和球球好像只有init transform feedback 阶段有区别, iter 阶段的区别要看效果
所以这部分应该是
- 发射阶段
- transform feedback init阶段(文字, 球)
- transform feedback iter阶段(重力, dampen, 拖尾)

还有个东西, 衍生发射器
- transform阶段的buffer, 作为另一个transfrom feedback init 的输入
- transform 阶段的buffer, 作为另一个transform feedback iter的部分输入

- instanced drawing
- post effect √
- rhi
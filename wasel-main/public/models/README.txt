// نموذج 3D بسيط جداً - مكعب متحرك
// هذا ملف نصي يتم تحويله إلى OBJ ثم GLB
// سنستخدم طريقة مختلفة - نموذج مدمج في الكود نفسه

// ملف بديل: نستخدم Three.js لإنشاء شخصية بسيطة مباشرة
const characterGeometry = {
  // Head (الرأس)
  head: {
    type: 'sphere',
    radius: 0.5,
    position: [0, 1.2, 0]
  },
  // Body (الجسم)
  body: {
    type: 'box',
    width: 0.6,
    height: 1,
    depth: 0.3,
    position: [0, 0.3, 0]
  },
  // Arms (الأذرع)
  leftArm: {
    type: 'box',
    width: 0.2,
    height: 0.8,
    depth: 0.2,
    position: [-0.5, 0.5, 0]
  },
  rightArm: {
    type: 'box',
    width: 0.2,
    height: 0.8,
    depth: 0.2,
    position: [0.5, 0.5, 0]
  },
  // Legs (الأرجل)
  leftLeg: {
    type: 'box',
    width: 0.2,
    height: 0.8,
    depth: 0.2,
    position: [-0.2, -0.5, 0]
  },
  rightLeg: {
    type: 'box',
    width: 0.2,
    height: 0.8,
    depth: 0.2,
    position: [0.2, -0.5, 0]
  }
};

export default characterGeometry;

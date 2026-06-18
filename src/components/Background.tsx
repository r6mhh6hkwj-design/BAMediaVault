/**
 * 背景装饰 — 胶片颗粒 + 流体光晕球
 */
export default function Background() {
  return (
    <>
      {/* 流体光晕球 */}
      <div
        className="glow-orb glow-orb-orange animate-float-slow"
        style={{ width: 500, height: 500, top: '-10%', left: '-5%' }}
      />
      <div
        className="glow-orb glow-orb-silver animate-float-slower"
        style={{ width: 400, height: 400, bottom: '-10%', right: '-5%' }}
      />
      <div
        className="glow-orb glow-orb-orange animate-float-slow"
        style={{ width: 300, height: 300, top: '40%', right: '20%', animationDelay: '4s' }}
      />
      {/* 胶片颗粒覆盖层 */}
      <div className="grain-overlay" />
    </>
  )
}

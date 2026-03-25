import { Zap } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div style={{
      position:'fixed', inset:0, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:24,
      background:'var(--bg-void)', zIndex:9999,
    }}>
      <div style={{
        width:64, height:64, borderRadius:18,
        background:'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(191,90,242,0.3) 100%)',
        border:'1px solid rgba(139,92,246,0.5)',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 0 30px rgba(157,78,221,0.5)',
        animation:'pulse-glow 2s ease-in-out infinite',
      }}>
        <Zap size={32} color="#bf5af2" />
      </div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:20, letterSpacing:'0.1em' }}>
        <span className="text-gradient">NOVACORD</span>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:6, height:6, borderRadius:'50%',
            background:'var(--violet-500)',
            animation:`pulse-dot 1.4s ease-in-out ${i*0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse-dot {
          0%,80%,100%{transform:scale(0.6);opacity:0.4}
          40%{transform:scale(1);opacity:1}
        }
        @keyframes pulse-glow {
          0%,100%{box-shadow:0 0 15px rgba(157,78,221,0.4)}
          50%{box-shadow:0 0 30px rgba(157,78,221,0.7)}
        }
      `}</style>
    </div>
  )
}

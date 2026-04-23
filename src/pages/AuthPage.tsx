import { useState } from 'react'
import { LogIn, UserPlus, Eye, EyeOff, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function AuthPage() {
  const { signUp, signIn } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email || !password) return

    setLoading(true)
    try {
      const fn = isLogin ? signIn : signUp
      const { error } = await fn(email, password)

      if (error) {
        setError(error)
      } else if (!isLogin) {
        setSuccess('注册成功！请查收邮箱确认链接，确认后即可登录。')
      }
      // 登录成功时 AuthContext 会自动处理 session
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <Clock size={32} className="text-accent" />
          </div>
          <h1 className="text-xl font-bold">时间资产</h1>
          <p className="text-sm text-text-muted mt-1">记录每一分钟，量化你的投入</p>
        </div>

        {/* 表单 */}
        <div className="bg-bg-card rounded-2xl shadow-[var(--shadow-modal)] overflow-hidden">
          {/* Tab */}
          <div className="flex border-b border-border-secondary">
            <button
              onClick={() => { setIsLogin(true); setError(''); setSuccess('') }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                isLogin ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <LogIn size={14} className="inline mr-1.5" />
              登录
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setSuccess('') }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                !isLogin ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <UserPlus size={14} className="inline mr-1.5" />
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-success/10 border border-success/20 rounded-lg px-3 py-2 text-xs text-success">
                {success}
              </div>
            )}

            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-bg-tertiary border border-border-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent text-text-primary placeholder:text-text-muted"
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? '输入密码' : '至少 6 位'}
                  required
                  minLength={6}
                  className="w-full bg-bg-tertiary border border-border-secondary rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-accent text-text-primary placeholder:text-text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-2.5 text-sm font-medium text-white transition-colors"
            >
              {loading ? '请稍候...' : isLogin ? '登录' : '注册'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          数据存储在云端，多设备自动同步
        </p>
      </div>
    </div>
  )
}

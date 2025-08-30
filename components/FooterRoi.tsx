import { motion } from 'framer-motion'

const FooterRoi = () => {
  return (
    <motion.footer
      className="bg-black text-white pt-8 pb-8 px-4"
      style={{ marginTop: '0' }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="max-w-6xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/ad66bb35-5690-4968-91e7-63b1b486122f.webp" 
            alt="Mentors Expert" 
            className="h-16 mx-auto" 
            loading="lazy" 
          />
        </div>

        {/* Copyright and Legal */}
        <div className="text-sm font-medium text-gray-300 mb-4">
          <p>© 2025 - Mentors Expert | Todos los derechos reservados | Políticas de Privacidad | Descargo de Responsabilidad</p>
        </div>

        {/* Facebook Disclaimer */}
        <div className="text-xs text-gray-300 max-w-4xl mx-auto leading-relaxed">
          <p>
            Este sitio no es parte del sitio web de Facebook o Facebook Inc. Adicionalmente, este sitio no está respaldado por Facebook de ninguna manera. FACEBOOK es una marca registrada de Facebook, Inc.
          </p>
        </div>
      </div>
    </motion.footer>
  )
}

export default FooterRoi

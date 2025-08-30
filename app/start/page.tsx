'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '@/components/hooks/UI/Modal'
import { MetaPixelEvents, trackCustomEvent } from '@/lib/fbpixel'
import { GAEvents, trackCustomEventGA } from '@/lib/gtag'
import FooterRoi from '@/components/FooterRoi'
import { useUser } from '@/components/hooks/useUser'
import { useToast } from '@/components/ui/Toast/ToastContext'

export default function StartPage() {
  const { user } = useUser()
  const { showToast } = useToast()
  const [isGoogleAdsModalOpen, setGoogleAdsModalOpen] = useState(false)
  const [isCallFormOpen, setCallFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isWorkshopSubmitting, setIsWorkshopSubmitting] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [workshopEmail, setWorkshopEmail] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    monthlyAdSpend: '',
    phoneNumber: '',
    companyWebsite: ''
  })

  // Get current date in Spanish format
  const getCurrentDateSpanish = () => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    const today = new Date()
    const day = today.getDate()
    const month = months[today.getMonth()]
    return `${day} de ${month}`
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleFormSubmit = async (e: React.FormEvent) => {
    console.log('🚀 [START PAGE] handleFormSubmit called!')
    
    try {
      e.preventDefault()
      console.log('✅ [START PAGE] preventDefault called')
      
      setIsSubmitting(true)
      console.log('✅ [START PAGE] setIsSubmitting(true) called')

      console.log('📝 [START PAGE] Form data:', formData)
      console.log('👤 [START PAGE] User:', user)

      // Validate required fields on client side
      if (!formData.email.trim()) {
        showToast('Please enter your email', 'error')
        setIsSubmitting(false)
        return
      }
      if (!formData.monthlyAdSpend.trim()) {
        showToast('Please enter your monthly ad spend', 'error')
        setIsSubmitting(false)
        return
      }
      if (!formData.phoneNumber.trim()) {
        showToast('Please enter your phone number', 'error')
        setIsSubmitting(false)
        return
      }

      console.log('✅ [START PAGE] Client validation passed')

      // Track form submission
      trackCustomEvent(MetaPixelEvents.COMPLEXITY_CONSULTATION, {
        content_name: 'Contact Form Submitted',
        content_category: 'Lead Generation',
        page: 'start',
        monthly_ad_spend: formData.monthlyAdSpend,
      })
      trackCustomEventGA(GAEvents.COMPLEXITY_CONSULTATION, {
        event_label: 'form_submitted',
        page: 'start',
        monthly_ad_spend: formData.monthlyAdSpend,
      })

      const requestBody = {
        email: formData.email,
        monthlyAdSpend: formData.monthlyAdSpend,
        phoneNumber: formData.phoneNumber,
        companyWebsite: formData.companyWebsite,
        userId: user?.id || null,
        formType: 'talk_to_expert'
      }

      console.log('📤 [START PAGE] Sending request with body:', requestBody)

      const response = await fetch('/api/telegram-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📥 [START PAGE] Response received. Status:', response.status)

      const result = await response.json()
      console.log('📄 [START PAGE] Response data:', result)

      if (!response.ok) {
        console.error('❌ [START PAGE] Response not ok:', result)
        throw new Error(result.error || 'Failed to submit form')
      }

      // Reset form and close modal only on success
      console.log('✅ [START PAGE] Resetting form and closing modal')
      setFormData({
        email: '',
        monthlyAdSpend: '',
        phoneNumber: '',
        companyWebsite: ''
      })
      
      showToast('Thank you! Your request has been submitted successfully.', 'success')
      setCallFormOpen(false)
      console.log('✅ [START PAGE] Form submission completed successfully')
      
    } catch (error) {
      console.error('❌ [START PAGE] Error in handleFormSubmit:', error)
      showToast(`Failed to submit form: ${error instanceof Error ? error.message : 'Please try again.'}`, 'error')
    } finally {
      console.log('🏁 [START PAGE] Finally block - setting isSubmitting to false')
      setIsSubmitting(false)
    }
  }

  const handleWorkshopSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsWorkshopSubmitting(true)

    try {
      if (!workshopEmail.trim()) {
        showToast('Por favor ingresa tu email', 'error')
        setIsWorkshopSubmitting(false)
        return
      }

      // Track workshop registration
      trackCustomEvent(MetaPixelEvents.ACCOUNT_CONNECTED, {
        content_name: 'Workshop Registration',
        content_category: 'Conversion',
        page: 'start',
      })
      trackCustomEventGA(GAEvents.ACCOUNT_CONNECTED, {
        event_label: 'workshop_registration',
        page: 'start',
      })

      const requestBody = {
        email: workshopEmail,
        userId: user?.id || null,
        formType: 'workshop_registration'
      }

      const response = await fetch('/api/telegram-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error('Failed to submit registration')
      }

      showToast('¡Registro exitoso! Te enviaremos los detalles del taller.', 'success')
      setWorkshopEmail('')
      setGoogleAdsModalOpen(false)
      
    } catch (error) {
      showToast('Error al registrarse. Por favor intenta de nuevo.', 'error')
    } finally {
      setIsWorkshopSubmitting(false)
    }
  }

  const handleAuditClick = () => {
    // Track audit button click
    trackCustomEvent(MetaPixelEvents.ACCOUNT_CONNECTED, {
      content_name: 'Free AI Audit Button Clicked',
      content_category: 'Conversion',
      page: 'start',
    })
    trackCustomEventGA(GAEvents.ACCOUNT_CONNECTED, {
      event_label: 'free_audit_click',
      page: 'start',
    })
    setGoogleAdsModalOpen(true)
  }

  const handleCallFormClick = () => {
    // Track call form button click
    trackCustomEvent(MetaPixelEvents.COMPLEXITY_CONSULTATION, {
      content_name: 'Request Call Button Clicked',
      content_category: 'Lead Generation',
      page: 'start',
    })
    trackCustomEventGA(GAEvents.COMPLEXITY_CONSULTATION, {
      event_label: 'request_call_click',
      page: 'start',
    })
    setCallFormOpen(true)
  }

  return (
    <main className="w-full text-white" style={{ backgroundColor: '#108da0' }}>
      {/* TOP TEAL BANNER */}
      <div 
        className="text-white text-center py-3 px-4"
        style={{
          backgroundColor: '#108da0'
        }}
      >
        <p className="text-sm font-bold">
          DOMINA LAS 10 HERRAMIENTAS DE IA QUE ESTÁN REVOLUCIONANDO LOS NEGOCIOS Y APRENDE A SER UN IMÁN DE VENTAS DESDE CASA.
        </p>
      </div>

      {/* MAIN HERO SECTION */}
      <section 
        className="relative min-h-[65vh] flex items-center px-4 md:px-8 lg:px-16 overflow-hidden"
        style={{
          margin: '0',
          padding: '2rem 1rem',
          backgroundImage: 'url(https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/TCjY8H49zByXAkq7vZ42/media/684bc23b869388d88b131964.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        
        {/* Desktop Layout */}
        <div 
          className="hidden lg:grid mx-auto relative z-10 lg:grid-cols-2 gap-8 items-center w-full"
          style={{
            width: '90%',
            maxWidth: '1200px',
            height: 'auto'
          }}
        >
          {/* LEFT CONTENT - Centered within this div */}
          <div className="text-center space-y-1" style={{ marginLeft: '0' }}>
            {/* Rocket Icon */}
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/85c23b2c-f0e8-46f2-95fc-f6b2bf0a20c4.webp" 
                alt="Rocket" 
                className="w-12 h-12 object-contain"
              />
            </motion.div>

            {/* Workshop Title */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/a9cfc9b8-88c3-4e28-b6b2-c972a3a9164b.webp" 
                alt="Taller de Inteligencia Artificial" 
                className="w-full max-w-xs mx-auto"
              />
            </motion.div>

            {/* Date and Spots Counter - Stacked vertically */}
            <motion.div
              className="flex flex-col justify-center items-center gap-1"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Date Badge */}
              <div 
                className="font-bold text-white flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: '#437fbd',
                  borderRadius: '25px',
                  boxShadow: '0 0 5px 0 #ffffffff',
                  fontSize: 'clamp(14px, 3vw, 24px)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '800',
                  width: 'clamp(260px, 70vw, 350px)',
                  minHeight: '48px',
                  height: 'auto',
                  padding: '12px 16px'
                }}
              >
                Fecha: 03 de Septiembre 2025
              </div>
              
              {/* Spots Counter */}
              <div 
                className="font-bold mx-auto"
                style={{
                  backgroundColor: '#e93d3d',
                  borderRadius: '25px',
                  boxShadow: '0 0 5px 0 #ffffffff',
                  width: 'clamp(260px, 70vw, 350px)',
                  minHeight: '74px',
                  height: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '12px 16px'
                }}
              >
                <div 
                  className="underline decoration-2"
                  style={{ 
                    color: '#eeff00',
                    fontSize: 'clamp(16px, 3vw, 24px)',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: '800'
                  }}
                >
                  455 cupos reservados
                </div>
                <div 
                  className="text-white"
                  style={{
                    fontSize: 'clamp(16px, 3vw, 24px)',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: '800'
                  }}
                >
                  últimos 20 cupos gratuitos.
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.p
              className="text-white mx-auto leading-tight"
              style={{
                fontSize: '12px',
                width: '100%',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '600'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              En este taller intensivo descubrirás cómo convertir la inteligencia artificial en tu mejor aliado para crear contenido viral en segundos (sin gastar ni un dólar en publicidad), automatizar tareas que te quitan tiempo y energía, construir negocios digitales que generen ingresos en piloto automático.
            </motion.p>

            {/* Warning Banner - Two separate buttons */}
            <motion.div
              className="flex flex-col items-center mx-auto space-y-2"
              style={{ width: '100%' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              {/* First button - Red */}
              <div 
                className="text-white font-bold text-center shadow-lg flex items-center justify-center"
                style={{
                  backgroundColor: '#fc4c18',
                  fontSize: 'clamp(12px, 3vw, 16px)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '800',
                  minHeight: '22px',
                  height: 'auto',
                  padding: '8px 16px',
                  maxWidth: '90vw',
                  wordWrap: 'break-word'
                }}
              >
                La IA no está para reemplazarte
              </div>
              
              {/* Second button - Yellow */}
              <div 
                className="text-black font-bold text-center shadow-lg flex items-center justify-center"
                style={{
                  backgroundColor: '#EEFF00',
                  fontSize: 'clamp(12px, 3vw, 16px)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '800',
                  minHeight: '22px',
                  height: 'auto',
                  padding: '8px 16px',
                  maxWidth: '90vw',
                  wordWrap: 'break-word'
                }}
              >
                está para multiplicarte.
              </div>
            </motion.div>

            {/* Final CTA Text */}
            <motion.p
              className="text-white mx-auto"
              style={{
                fontSize: '12px',
                width: '100%',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '600'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              Te mostraremos cómo convertirla en tu mejor aliada para vender más, trabajar menos y escalar más rápido que nunca.
            </motion.p>
          </div>

          {/* RIGHT CONTENT - Cyborg People + Button */}
          <div className="text-center space-y-4 md:space-y-6 mt-8 lg:mt-0">
            <motion.div
              className="relative"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {/* Desktop image */}
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/f95caf49-b5a9-4ff5-b3be-ace65d79d574.webp" 
                alt="AI Workshop Participants" 
                className="hidden md:block w-4/5 h-auto mx-auto"
              />
              {/* Mobile image */}
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/f1f31866-2238-41f2-91e5-899438645d4b.webp" 
                alt="AI Workshop Participants" 
                className="block md:hidden w-4/5 h-auto mx-auto"
              />
            </motion.div>

            {/* Main CTA Button - Under the photo */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <button
                onClick={handleAuditClick}
                className="text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 inline-flex items-center justify-center gap-2 text-center whitespace-nowrap"
                style={{
                  backgroundColor: '#437fbd',
                  boxShadow: '0 0 10px 0 #ffffffff',
                  fontSize: 'clamp(14px, 1.2vw, 20px)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '800',
                  minWidth: '280px',
                  maxWidth: '400px',
                  width: 'max-content',
                  minHeight: '56px',
                  height: 'auto'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a6ca8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#437fbd'}
              >
                RESERVAR GRATIS MI CUPO →
              </button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="block lg:hidden mx-auto relative z-10 w-full px-4">
          <div className="text-center space-y-4">
            {/* Rocket Icon */}
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/85c23b2c-f0e8-46f2-95fc-f6b2bf0a20c4.webp" 
                alt="Rocket" 
                className="w-12 h-12 object-contain"
              />
            </motion.div>

            {/* Workshop Title */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/a9cfc9b8-88c3-4e28-b6b2-c972a3a9164b.webp" 
                alt="Taller de Inteligencia Artificial" 
                className="w-full max-w-xs mx-auto"
              />
            </motion.div>

            {/* Mobile image - Before date badges */}
            <motion.div
              className="relative"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/f1f31866-2238-41f2-91e5-899438645d4b.webp" 
                alt="AI Workshop Participants" 
                className="w-4/5 h-auto mx-auto"
              />
            </motion.div>

            {/* Date and Spots Counter */}
            <motion.div
              className="flex flex-col justify-center items-center gap-2"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Date Badge */}
              <div 
                className="font-bold text-white flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: '#437fbd',
                  borderRadius: '25px',
                  boxShadow: '0 0 5px 0 #ffffffff',
                  fontSize: 'clamp(14px, 3vw, 24px)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '800',
                  width: 'clamp(260px, 70vw, 350px)',
                  minHeight: '48px',
                  height: 'auto',
                  padding: '12px 16px'
                }}
              >
                Fecha: 03 de Septiembre 2025
              </div>
              
              {/* Spots Counter */}
              <div 
                className="font-bold mx-auto"
                style={{
                  backgroundColor: '#e93d3d',
                  borderRadius: '25px',
                  boxShadow: '0 0 5px 0 #ffffffff',
                  width: 'clamp(260px, 70vw, 350px)',
                  minHeight: '74px',
                  height: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '12px 16px'
                }}
              >
                <div 
                  className="underline decoration-2"
                  style={{ 
                    color: '#eeff00',
                    fontSize: 'clamp(16px, 3vw, 24px)',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: '800'
                  }}
                >
                  455 cupos reservados
                </div>
                <div 
                  className="text-white"
                  style={{
                    fontSize: 'clamp(16px, 3vw, 24px)',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: '800'
                  }}
                >
                  últimos 20 cupos gratuitos.
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.p
              className="text-white mx-auto leading-tight"
              style={{
                fontSize: '12px',
                width: '100%',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '600'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              En este taller intensivo descubrirás cómo convertir la inteligencia artificial en tu mejor aliado para crear contenido viral en segundos (sin gastar ni un dólar en publicidad), automatizar tareas que te quitan tiempo y energía, construir negocios digitales que generen ingresos en piloto automático.
            </motion.p>

            {/* Warning Banner - Two separate buttons */}
            <motion.div
              className="flex flex-col items-center mx-auto space-y-2"
              style={{ width: '100%' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {/* First button - Red */}
              <div 
                className="text-white font-bold text-center shadow-lg flex items-center justify-center"
                style={{
                  backgroundColor: '#fc4c18',
                  fontSize: 'clamp(12px, 3vw, 16px)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '800',
                  minHeight: '22px',
                  height: 'auto',
                  padding: '8px 16px',
                  maxWidth: '90vw',
                  wordWrap: 'break-word'
                }}
              >
                La IA no está para reemplazarte
              </div>
              
              {/* Second button - Yellow */}
              <div 
                className="text-black font-bold text-center shadow-lg flex items-center justify-center"
                style={{
                  backgroundColor: '#EEFF00',
                  fontSize: 'clamp(12px, 3vw, 16px)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '800',
                  minHeight: '22px',
                  height: 'auto',
                  padding: '8px 16px',
                  maxWidth: '90vw',
                  wordWrap: 'break-word'
                }}
              >
                está para multiplicarte.
              </div>
            </motion.div>

            {/* Final CTA Text */}
            <motion.p
              className="text-white mx-auto"
              style={{
                fontSize: '12px',
                width: '100%',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '600'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Te mostraremos cómo convertirla en tu mejor aliada para vender más, trabajar menos y escalar más rápido que nunca.
            </motion.p>

            {/* Main CTA Button */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <button
                onClick={handleAuditClick}
                className="text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 inline-flex items-center justify-center gap-2 text-center whitespace-nowrap"
                style={{
                  backgroundColor: '#437fbd',
                  boxShadow: '0 0 10px 0 #ffffffff',
                  fontSize: 'clamp(14px, 1.2vw, 20px)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '800',
                  minWidth: '280px',
                  maxWidth: '400px',
                  width: 'max-content',
                  minHeight: '56px',
                  height: 'auto'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a6ca8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#437fbd'}
              >
                RESERVAR GRATIS MI CUPO →
              </button>
            </motion.div>
          </div>
        </div>
        
        {/* Downward Arrow */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <svg className="w-8 h-8 text-white animate-bounce" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
      </section>

      {/* SECOND SECTION - Video Player */}
      <section 
        className="relative min-h-screen flex items-center justify-center px-4"
        style={{
          marginTop: '0',
          paddingTop: '2rem',
          paddingBottom: '2rem',
          backgroundImage: 'url(https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/TCjY8H49zByXAkq7vZ42/media/684bc70b625d67bebef09317.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative max-w-4xl w-full">
          {/* Orange bar above video */}
          <div 
            className="text-white text-center px-2 md:px-6 font-bold mb-0 flex items-center justify-center"
            style={{
              backgroundColor: '#fc4c18',
              height: '20px',
              fontSize: 'clamp(10px, 2.5vw, 18px)'
            }}
          >
            DALE CLIC AL VIDEO Y MÍRALO HASTA EL FINAL
          </div>
          
          {/* Video player container with yellow glow */}
          <div className="relative">
            {/* Yellow glow effect */}
            <div className="absolute inset-0 bg-yellow-400 rounded-lg blur-md opacity-30 scale-105"></div>
            
            {/* Video player */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <iframe 
                className="w-full h-auto"
                style={{ aspectRatio: '16/9' }}
                src="https://player.vimeo.com/video/826239791?autoplay=0&loop=0&muted=0&gesture=media&playsinline=1&controls=1"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Video"
              ></iframe>
            </div>
          </div>
          
          {/* Yellow block below video */}
          <div 
            className="text-black text-center py-4 px-6 font-bold text-lg mt-0"
            style={{
              backgroundColor: '#eeff00'
            }}
          >
            <div 
              style={{
                fontSize: 'clamp(20px, 5vw, 35px)',
                fontWeight: '700'
              }}
            >
              <strong>MIÉRCOLES 27 DE AGOSTO 2025 - ÚNETE A</strong>
            </div>
            <div 
              style={{
                fontSize: 'clamp(20px, 5vw, 35px)',
                fontWeight: '700'
              }}
            >
              <strong>2 HORAS EN VIVO DE CONTENIDO DE VALOR!</strong>
            </div>
          </div>
          
          {/* Time schedule */}
          <div className="text-center text-white mt-6 px-4">
            <p className="font-bold mb-4" style={{ fontSize: 'clamp(14px, 3vw, 18px)' }}>7:00 pm a 9:00pm COL Horario de inicio en otros países</p>
            
            {/* Time zones image */}
            <div className="flex justify-center">
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/68ab6c7119f127440d70d8a8.png" 
                alt="" 
                className="max-w-full h-auto" 
                loading="lazy" 
              />
            </div>
            
            <p className="text-white font-bold mt-6 px-4" style={{ fontSize: 'clamp(16px, 3.5vw, 18px)' }}>
              Últimas horas para que te registres GRATIS en el taller de este Miércoles
            </p>
            
            {/* CTA Button */}
            <motion.div
              className="mt-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <button
                onClick={handleAuditClick}
                className="text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 inline-flex items-center justify-center gap-2 text-center whitespace-nowrap"
                style={{
                  backgroundColor: '#437fbd',
                  boxShadow: '0 0 10px 0 #ffffffff',
                  fontSize: 'clamp(14px, 1.2vw, 20px)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '800',
                  minWidth: '280px',
                  maxWidth: '400px',
                  width: 'max-content',
                  minHeight: '56px',
                  height: 'auto'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a6ca8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#437fbd'}
              >
                RESERVAR GRATIS MI CUPO →
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* THIRD SECTION - Benefits Grid */}
      <section 
        className="relative flex items-center justify-center px-4 py-12"
        style={{
          minHeight: '80vh',
          backgroundImage: 'url(https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/TCjY8H49zByXAkq7vZ42/media/684bc23b869388d88b131964.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-6xl w-full text-center">
          {/* Section Title */}
          <motion.h2
            className="text-white text-4xl font-bold mb-12"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            ESTE TALLER EN VIVO ES PARA TI SI...
          </motion.h2>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 px-4 md:px-0">
            {/* Card 1 */}
            <motion.div
              className="bg-white rounded-xl p-6 text-center shadow-lg"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/287b187e-c8f7-46e0-869e-45155975f02e.png" 
                alt="" 
                className="w-16 h-16 mx-auto mb-4" 
                loading="lazy" 
              />
              <p className="text-black text-sm font-bold">
                Quieres aprender a usar la IA para crear contenido viral en segundos, sin grabarte ni editar.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              className="bg-white rounded-xl p-6 text-center shadow-lg"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/0c709fb8-e80a-43da-9842-a3f2ae256e83.png" 
                alt="" 
                className="w-16 h-16 mx-auto mb-4" 
                loading="lazy" 
              />
              <p className="text-black text-sm font-bold">
                Te gustaría automatizar tareas repetitivas y liberar tiempo usando herramientas de inteligencia artificial.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              className="bg-white rounded-xl p-6 text-center shadow-lg"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/8df4949b-980a-40af-aa0b-bdc79575b9fc.png" 
                alt="" 
                className="w-16 h-16 mx-auto mb-4" 
                loading="lazy" 
              />
              <p className="text-black text-sm font-bold">
                Quieres usar la IA para vender más y atraer clientes sin depender de agencias ni freelancers.
              </p>
            </motion.div>

            {/* Card 4 */}
            <motion.div
              className="bg-white rounded-xl p-6 text-center shadow-lg"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/8085ee68-dc53-4f7e-8933-840037d34b0d.png" 
                alt="" 
                className="w-16 h-16 mx-auto mb-4" 
                loading="lazy" 
              />
              <p className="text-black text-sm font-bold">
                Buscas generar ingresos en piloto automático con negocios digitales potenciados por IA.
              </p>
            </motion.div>

            {/* Card 5 */}
            <motion.div
              className="bg-white rounded-xl p-6 text-center shadow-lg"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/ba39d724-1fb9-41fe-949a-c3fda29744fe.png" 
                alt="" 
                className="w-16 h-16 mx-auto mb-4" 
                loading="lazy" 
              />
              <p className="text-black text-sm font-bold">
                Te interesa dominar las 10 herramientas de IA que están revolucionando el mercado y aplicarlas en tu negocio.
              </p>
            </motion.div>

            {/* Card 6 */}
            <motion.div
              className="bg-white rounded-xl p-6 text-center shadow-lg"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/205504eb-49ab-496b-9bcd-02bad5c0132d.png" 
                alt="" 
                className="w-16 h-16 mx-auto mb-4" 
                loading="lazy" 
              />
              <p className="text-black text-sm font-bold">
                Estás cansado de hacer todo tú y quieres que la IA trabaje contigo para ti.
              </p>
            </motion.div>

            {/* Card 7 */}
            <motion.div
              className="bg-white rounded-xl p-6 text-center shadow-lg"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/8f48451e-30c6-426b-95d4-de161f91463a.png" 
                alt="" 
                className="w-16 h-16 mx-auto mb-4" 
                loading="lazy" 
              />
              <p className="text-black text-sm font-bold">
                No eres técnico, pero quieres entender cómo usar la IA de forma práctica y rentable.
              </p>
            </motion.div>

            {/* Card 8 */}
            <motion.div
              className="bg-white rounded-xl p-6 text-center shadow-lg"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/04984976-07b4-4b3e-aea8-92aff845a5e7.png" 
                alt="" 
                className="w-16 h-16 mx-auto mb-4" 
                loading="lazy" 
              />
              <p className="text-black text-sm font-bold">
                Quieres destacar, diferenciarte y escalar más rápido usando tecnología que muy pocos están aprovechando hoy.
              </p>
            </motion.div>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <button
              onClick={handleAuditClick}
              className="text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 inline-flex items-center justify-center gap-2 text-center whitespace-nowrap"
              style={{
                backgroundColor: '#437fbd',
                boxShadow: '0 0 10px 0 #ffffffff',
                fontSize: 'clamp(14px, 1.2vw, 20px)',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '800',
                minWidth: '280px',
                maxWidth: '400px',
                width: 'max-content',
                minHeight: '56px',
                height: 'auto'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a6ca8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#437fbd'}
            >
              RESERVAR GRATIS MI CUPO →
            </button>
          </motion.div>
        </div>
      </section>

      {/* FOURTH SECTION - Roadmap */}
      <section 
        className="relative flex items-center justify-center px-4 py-16"
        style={{
          backgroundImage: 'url(https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/TCjY8H49zByXAkq7vZ42/media/684bc70b625d67bebef09317.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-6xl w-full text-center">
          {/* Section Title */}
          <motion.h2
            className="text-white text-4xl font-black mb-6"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            ESTA SERÁ TU HOJA DE RUTA DURANTE EL TALLER
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-white text-lg font-bold mb-12 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            En este taller vas a aprender cómo la inteligencia artificial puede ayudarte a hacer el trabajo más fácil, más rápido y con mejores resultados -sin tener que saber de diseño, redes o programación. Cada punto que verás está pensado para que lo entiendas, lo apliques y lo uses en tu negocio o en tu día a día.
          </motion.p>

          {/* Roadmap Grid - First Row (5 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
            {/* Card 1 */}
            <motion.div
              className="bg-white rounded-b-xl shadow-lg overflow-hidden w-full md:w-64 lg:w-48"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-blue-500 blur-md opacity-60 scale-105"></div>
                <img 
                  src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/53bb66ae-b644-42b3-aada-f72a035e0881.jpeg" 
                  alt="" 
                  className="w-full h-40 object-cover relative z-10" 
                  loading="lazy" 
                />
              </div>
              <div className="p-5">
                <h3 className="text-black text-base font-black mb-2 text-left">Crea vídeos virales y clonate digitalmente</h3>
                <p className="text-black text-xs font-bold text-left">
                  Aprenderás a crear videos virales para redes sociales, que atraen vistas, comentarios y ventas… ¡sin tener que grabarte! Incluso podrás crear una versión digital de ti mismo que hable por ti, con tu voz, tu cara o un avatar que te representa.
                </p>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              className="bg-white rounded-b-xl shadow-lg overflow-hidden w-full md:w-64 lg:w-48"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-blue-500 blur-md opacity-60 scale-105"></div>
                <img 
                  src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/b41c4898-edaa-4efb-8c08-f96a2be72573.jpeg" 
                  alt="" 
                  className="w-full h-40 object-cover relative z-10" 
                  loading="lazy" 
                />
              </div>
              <div className="p-5">
                <h3 className="text-black text-base font-black mb-2 text-left">Crear imágenes impactantes</h3>
                <p className="text-black text-xs font-bold text-left">
                  Te imaginas que con tan solo escribir lo que imaginas, la IA te ayudará a crear imágenes increíbles en segundos para redes sociales, productos o ideas. Todo esto lo aprenderás en nuestro taller de este sábado de inteligencia artificial aplicada a productos digitales.
                </p>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              className="bg-white rounded-b-xl shadow-lg overflow-hidden w-full md:w-64 lg:w-48"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-blue-500 blur-md opacity-60 scale-105"></div>
                <img 
                  src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/1abba317-ec86-4599-9d04-6a184debcab8.jpeg" 
                  alt="" 
                  className="w-full h-40 object-cover relative z-10" 
                  loading="lazy" 
                />
              </div>
              <div className="p-5">
                <h3 className="text-black text-base font-black mb-2 text-left">Crea un asistente de voz que hable por ti</h3>
                <p className="text-black text-xs font-bold text-left">
                  También verás cómo tener tu propio robot inteligente que conteste llamadas o mensajes con voz humana, respondiendo dudas, dando información y hasta ayudando a cerrar ventas. Estará activo 24/7 para ti. Te imaginas todo lo que lograras?
                </p>
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div
              className="bg-white rounded-b-xl shadow-lg overflow-hidden w-full md:w-64 lg:w-48"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-blue-500 blur-md opacity-60 scale-105"></div>
                <img 
                  src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/d86f247e-a709-4ca4-91e8-13f4268e030d.jpeg" 
                  alt="" 
                  className="w-full h-40 object-cover relative z-10" 
                  loading="lazy" 
                />
              </div>
              <div className="p-5">
                <h3 className="text-black text-base font-black mb-2 text-left">Rediseña espacios con solo una foto</h3>
                <p className="text-black text-xs font-bold text-left">
                  Subes una imagen de una sala o local… y la IA te da diseños nuevos, estilos decorativos y ambientes visuales en segundos. Ideal si estás en el mundo de los bienes raíces, la decoración o simplemente quieres presentar espacios de forma atractiva y moderna.
                </p>
              </div>
            </motion.div>

            {/* Card 5 */}
            <motion.div
              className="bg-white rounded-b-xl shadow-lg overflow-hidden w-full md:w-64 lg:w-48"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-blue-500 blur-md opacity-60 scale-105"></div>
                <img 
                  src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/dda49d35-d8eb-46c8-acc5-85cb91dbef03.jpeg" 
                  alt="" 
                  className="w-full h-40 object-cover relative z-10" 
                  loading="lazy" 
                />
              </div>
              <div className="p-5">
                <h3 className="text-black text-base font-black mb-2 text-left">Crea un avatar que hable por ti</h3>
                <p className="text-black text-xs font-bold text-left">
                  Aprenderás a crear un personaje virtual que presenta, explica o vende en lugar tuyo. Este avatar puede hablar con voz realista y expresar tus ideas sin que tu tengas que aparecer en cámara. Ideal para presentaciones, cursos, promociones o redes sociales.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Roadmap Grid - Second Row (4 cards) */}
          <div className="flex flex-wrap justify-center gap-6">
            {/* Card 6 */}
            <motion.div
              className="bg-white rounded-b-xl shadow-lg overflow-hidden w-full md:w-64 lg:w-48"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-blue-500 blur-md opacity-60 scale-105"></div>
                <img 
                  src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/c364d832-c9a1-4d63-a024-37b2779c7c20.jpeg" 
                alt="" 
                  className="w-full h-40 object-cover relative z-10" 
                  loading="lazy" 
                />
              </div>
              <div className="p-5">
                <h3 className="text-black text-base font-black mb-2 text-left">Automatiza respuestas con un chat inteligente</h3>
                <p className="text-black text-xs font-bold text-left">
                  Verás cómo configurar un chatbot que responde mensajes automáticamente: da información, guía a los clientes y hasta toma pedidos o agenda citas. Funciona en tu sitio web, WhatsApp o redes, y trabaja todo el día por ti.
                </p>
              </div>
            </motion.div>

            {/* Card 7 */}
            <motion.div
              className="bg-white rounded-b-xl shadow-lg overflow-hidden w-full md:w-64 lg:w-48"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-blue-500 blur-md opacity-60 scale-105"></div>
                <img 
                  src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/b151b5e5-b2e0-44f0-b06c-5557ba48ae33.jpeg" 
                  alt="" 
                  className="w-full h-40 object-cover relative z-10" 
                  loading="lazy" 
                />
              </div>
              <div className="p-5">
                <h3 className="text-black text-base font-black mb-2 text-left">Lanza un negocio digital desde cero con IA</h3>
                <p className="text-black text-xs font-bold text-left">
                  Te mostraremos cómo puedes construir un negocio online usando solo inteligencia artificial: desde la idea, el contenido, la automatización, hasta la venta. Todo esto sin tener equipo, sin saber de tecnología, y desde casa.
                </p>
              </div>
            </motion.div>

            {/* Card 8 */}
            <motion.div
              className="bg-white rounded-b-xl shadow-lg overflow-hidden w-full md:w-64 lg:w-48"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-blue-500 blur-md opacity-60 scale-105"></div>
                <img 
                  src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/b00382ac-c008-4c50-b3c6-a05e097c0018.jpeg" 
                  alt="" 
                  className="w-full h-40 object-cover relative z-10" 
                  loading="lazy" 
                />
              </div>
              <div className="p-5">
                <h3 className="text-black text-base font-black mb-2 text-left">Crea tu propia página web en minutos</h3>
                <p className="text-black text-xs font-bold text-left">
                  Podrás tener una página web profesional, sin saber diseñar ni programar. La IA te ayuda a escribir, estructurar y publicar una página lista para atraer clientes o mostrar tus servicios.
                </p>
              </div>
            </motion.div>

            {/* Card 9 */}
            <motion.div
              className="bg-white rounded-b-xl shadow-lg overflow-hidden w-full md:w-64 lg:w-48"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-blue-500 blur-md opacity-60 scale-105"></div>
                <img 
                  src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/a2018dc3-08b1-4423-9292-87af032a4c7f.jpeg" 
                  alt="" 
                  className="w-full h-40 object-cover relative z-10" 
                  loading="lazy" 
                />
              </div>
              <div className="p-5">
                <h3 className="text-black text-base font-black mb-2 text-left">Crea canciones o música original desde cero</h3>
                <p className="text-black text-xs font-bold text-left">
                  Conocerás cómo la IA puede ayudarte a crear canciones únicas, sonidos, intros o pistas musicales con solo escribir una idea. Ideal para redes, contenido, branding o simplemente para explorar tu lado creativo.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FIFTH SECTION - Experts */}
      <section 
        className="relative flex items-center justify-center px-4 pt-16 pb-24"
        style={{
          minHeight: '70vh',
          marginBottom: '0',
          backgroundImage: 'url(https://images.leadconnectorhq.com/image/f_webp/q_80/r_768/u_https://assets.cdn.filesafe.space/TCjY8H49zByXAkq7vZ42/media/684bc23b869388d88b131964.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-6xl w-full text-center">
          {/* Section Title */}
          <motion.h2
            className="text-white text-4xl font-black mb-12"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            ¿CON QUIÉN APRENDERÁS EN ESTE TALLER ?
          </motion.h2>

          {/* Experts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Expert 1 - Alejandro Sarria */}
            <motion.div
              className="text-center"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/b94c82bc-bae9-41df-8b02-0e69b356f732.webp" 
                alt="Alejandro Sarria" 
                className="w-64 h-64 object-contain rounded-full mx-auto mb-3" 
                loading="lazy" 
              />
              <h3 className="text-white text-2xl font-black mb-2">ALEJANDRO SARRIA</h3>
              <div className="text-white text-sm font-bold space-y-2 max-w-md mx-auto">
                <p>Ingeniero en electrónica y telecomunicaciones, Master en dirección de Marketing Digital, Co fundador de Conexo Digital y Mentor IA.</p>
                <p>Además de ser especialista en gerencia de proyectos informáticos, con más de 12 años de experiencia implementando estrategias de marketing digital para empresas en Latinoamérica como Porvenir, Facebook, Google Colombia, es conferencista invitado para el programa de aceleración de empresas en Google Launchpad.</p>
              </div>
            </motion.div>

            {/* Expert 2 - Yeison Cajas */}
            <motion.div
              className="text-center"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/814cf2cb-735e-4091-aa9b-37a64755f0b7.webp" 
                alt="Yeison Cajas" 
                className="w-64 h-64 object-contain rounded-full mx-auto mb-3" 
                loading="lazy" 
              />
              <h3 className="text-white text-2xl font-black mb-2">YEISON CAJAS</h3>
              <div className="text-white text-sm font-bold space-y-2 max-w-md mx-auto">
                <p>Conferencista de marketing digital y creatividad. Desde los 17 años ha emprendido en la industria digital, siendo finalista en 4 competencias de emprendimiento e innovación en el país. Actualmente es Co-Fundador de Mentors Expert, programa de acompañamiento que busca mejorar la calidad de vida de los emprendedores, generando mejores ingresos gracias al e-commerce de productos digitales con hotmart.</p>
              </div>
            </motion.div>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <button
              onClick={handleAuditClick}
              className="text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 inline-flex items-center justify-center gap-2 text-center whitespace-nowrap"
              style={{
                backgroundColor: '#437fbd',
                boxShadow: '0 0 10px 0 #ffffffff',
                fontSize: 'clamp(14px, 1.2vw, 20px)',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '800',
                minWidth: '280px',
                maxWidth: '400px',
                width: 'max-content',
                minHeight: '56px',
                height: 'auto'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a6ca8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#437fbd'}
            >
              RESERVAR GRATIS MI CUPO →
            </button>
          </motion.div>
        </div>
      </section>

      {/* Workshop Registration Modal */}
      <Modal
        id="workshop-modal-start"
        isOpen={isGoogleAdsModalOpen}
        onClose={() => setGoogleAdsModalOpen(false)}
        className="z-[9999999]"
      >
        <div 
          className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden"
          style={{
            backgroundImage: 'url(https://images.leadconnectorhq.com/image/f_webp/q_80/r_768/u_https://assets.cdn.filesafe.space/TCjY8H49zByXAkq7vZ42/media/684bc23b869388d88b131964.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '500px'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setGoogleAdsModalOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold z-10"
          >
            ×
          </button>
          
          {/* Content */}
          <div className="p-4 md:p-8 text-center text-white flex flex-col justify-center min-h-[500px] relative">
            {/* Header */}
            <div className="mb-6">
              <img 
                src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/pTy8EEnLSfkgXEP4uL0V/media/2d79bc52-4fa3-44a4-855c-69222834cf68.webp" 
                alt="Taller de Inteligencia Artificial" 
                className="max-w-full h-auto mx-auto mb-4" 
                loading="lazy"
                style={{ maxWidth: '300px' }}
              />
              <p className="text-sm font-semibold bg-white text-black px-4 py-1 rounded-full inline-block">
                100% ONLINE Y EN VIVO
              </p>
            </div>
            
            {/* Main message */}
            <h2 className="text-2xl font-black mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              ¡EL ENTRENAMIENTO ESTÁ LISTO!
            </h2>
            
            <p className="text-sm mb-6 max-w-md mx-auto leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Reserva tu cupo para acceder <strong>GRATIS</strong> al taller en vivo este Miércoles {getCurrentDateSpanish()} 7pm, 
              completando el formulario y dando clic en el botón verde
            </p>
            
            {/* Form */}
            <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
              <form onSubmit={handleWorkshopSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Escribe tu mejor correo *"
                    required
                    value={workshopEmail}
                    onChange={(e) => setWorkshopEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-black placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isWorkshopSubmitting}
                  className="w-full py-3 text-white font-bold rounded-md transition-all duration-200 hover:shadow-lg"
                  style={{
                    backgroundColor: '#22c55e',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '16px'
                  }}
                >
                  {isWorkshopSubmitting ? 'ENVIANDO...' : 'Registrarme GRATIS!'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </Modal>

      {/* Call Request Form Modal */}
      <Modal
        id="call-form-modal"
        isOpen={isCallFormOpen}
        onClose={() => setCallFormOpen(false)}
        className="z-[9999999]"
      >
        <div className="p-6 bg-white rounded-xl max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Talk to an Expert.</h2>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email:
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Monthly Ad Spend:
              </label>
              <input
                type="text"
                required
                value={formData.monthlyAdSpend}
                onChange={(e) => setFormData({ ...formData, monthlyAdSpend: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number:
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Website (Optional):
              </label>
              <input
                type="text"
                placeholder="example.com"
                value={formData.companyWebsite}
                onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-3 text-lg font-medium text-white bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-300"
            >
              {isSubmitting ? 'SUBMITTING...' : 'REQUEST MY CALL'}
            </button>
          </form>
        </div>
      </Modal>
      
      {/* Footer */}
      <FooterRoi />
    </main>
  )
}
import s from './LoadingDots.module.css'

const LoadingDots = ({ classDots }: { classDots?: string }) => {
  return (
    <span className={s.root}>
      <span className={classDots} />
      <span className={classDots} />
      <span className={classDots} />
    </span>
  )
}

export default LoadingDots

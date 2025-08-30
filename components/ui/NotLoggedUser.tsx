import GoogleButton from './google-button/GoogleButton'

const NotLoggedUser = () => (
  <div className="bg-white w-1/2 flex flex-col gap-8 p-8 mx-auto justify-center items-center text-center rounded-sm">
    <div className="text-black text-[22px] font-medium mt-[300px]">
      You need to log in to change settings
    </div>
    <GoogleButton />
  </div>
)

export default NotLoggedUser

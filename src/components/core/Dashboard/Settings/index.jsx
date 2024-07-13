import UpdatePassword from "./UpdatePassword"
import ChangeProfilePicture from "./ChangeProfilePicture"
import EditProfile from "./EditProfile"
import DeleteAccount from "./DeleteAccount"
export default function Settings(){
    return (
        <>
            <h1 className=" mb-14 text-3xl font-medium text-richblack-5">Edit Profile</h1>
            {/* change profile picture */}
            <ChangeProfilePicture/>
            {/* edit profile */}
            <EditProfile/>
            {/* change password */}
            <UpdatePassword/>
            {/* delete account */}
            <DeleteAccount/>
        </>
    )
}
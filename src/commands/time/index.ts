import dayjs from "dayjs";
export default  function (time:string) {
    console.log(dayjs(Number(time)).format('YYYY-MM-DD HH:mm:ss'));
}
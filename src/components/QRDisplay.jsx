import { QRCodeSVG } from 'qrcode.react'

export default function QRDisplay({ studentId }) {
  return (
    <div className="bg-white p-4 rounded-[20px] inline-block shadow-lg mx-auto">
      <QRCodeSVG 
        value={`student:${studentId}`} 
        size={280} 
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
        includeMargin={true}
      />
    </div>
  )
}

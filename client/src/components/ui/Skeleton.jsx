import React from 'react'

export default function Skeleton({className=''}){
  return <div className={"bg-gray-700/40 rounded animate-pulse "+className} />
}

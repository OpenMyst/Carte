"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

/**
 * The `Home` component renders the main page of the OpenMyst platform.
 * 
 * This page provides an overview of the platform, including:
 * - A description of OpenMyst and its purpose.
 * - A set of action buttons for user interactions.
 * - A list of key features offered by the platform, each represented by a card.
 * 
 * The layout is responsive, adapting to different screen sizes with a grid system for the services section.
 * 
 * @returns {JSX.Element} A `div` containing the page content, including:
 * - A card with a title and description of OpenMyst.
 * - A set of buttons for login, account creation, and accessing the platform without an account.
 * - A grid of cards showcasing the main features of the platform.
 */

const services = [
  {
    id: 1,
    title: "Collaboratif",
    description: "Contribute to this magnificent cathedral of data. Let's build together the most comprehensive knowledge base on the life of Jesus."
  },
  {
    id: 2,
    title: "3D Immersion",
    description: "Dive into the Bible and follow Jesus, day by day, village by village. Thanks to our 3D mapping, visualize where each event took place."
  },
  {
    id: 3,
    title: "Non-profit",
    description: "Using the platform, with or without an account, is free. The generosity of our community allows OpenMyst to remain accessible to all."
  },
  {
    id: 4,
    title: "International",
    description: "Our goal is to make OpenMyst available in as many languages ​​as possible so you can read Jesus in your own language."
  },
]

const Home = () => {
  return (
    <div className='m-10 text-center flex flex-col items-center'>
      <div>
        <Card className="border-none mb-0">
          <CardHeader>
            <CardTitle className="text-center font-bold">OpenMyst</CardTitle>
            <CardDescription className="font-medium text-lg mb-0">Knowing your life will change yours</CardDescription>
          </CardHeader>
          <CardContent className="text-start">
          Open Myst is a 3D visualization platform that brings together the most reliable data available on the life of Jesus
          </CardContent>
        </Card>
      </div>
      <div className='grid grid-cols-3 ml-5 mr-5 mb-0 md:w-[50vw] sm:w-full'>
        <Button variant="outline">Login</Button>
        <Button variant="outline">Create an account</Button>
        <Button variant="outline">Access without account</Button>
      </div>
      <div className='grid md:grid-cols-2 sm:grid-cols-1 m-5 md:w-[50vw] sm:w-full'>
        {services.map(item => (
          <Card key={item.id} className="border-none">
            <CardHeader>
              <CardTitle className="text-start">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              {item.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Home
"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

const services = [
  {
    id: 1,
    title: "Collaboratif",
    description: "Contribuez à cette magnifique cathédrale de données. Construisons ensemble la base de connaissances la plus complète sur la vie de Jésus."
  },
  {
    id: 2,
    title: "Immersion 3D",
    description: "Plongez dans la Bible et suivez Jésus, jour après jour, village par village. Grâce à notre cartographie 3D, visualisez où chaque événement a eu lieu."
  },
  {
    id: 3,
    title: "Non lucratif",
    description: "L'utilisation de la plateforme, avec ou sans compte, est gratuite. La générosité de notre communauté permet à OpenMyst de rester accessible à tous."
  },
  {
    id: 4,
    title: "International",
    description: "Notre objectif est de rendre OpenMyst disponible dans autant de langues que possible afin que vous puissiez lire Jésus dans votre propre langue."
  },
]

const Home = () => {
  return (
    <div className='m-10 text-center flex flex-col items-center'>
      <div>
        <Card className="border-none mb-0">
          <CardHeader>
            <CardTitle className="text-center font-bold">OpenMyst</CardTitle>
            <CardDescription className="font-medium text-lg mb-0">Connaître sa vie changera la vôtre</CardDescription>
          </CardHeader>
          <CardContent className="text-start">
          OpenMyst est une platforme de visualisation 3D qui rassemble des données les plus fiables disponibles sur la vie de Jésus
          </CardContent>
        </Card>
      </div>
      <div className='grid grid-cols-3 ml-5 mr-5 mb-0 md:w-[50vw] sm:w-full'>
        <Button variant="outline">Se connecter</Button>
        <Button variant="outline">Créer un compte</Button>
        <Button variant="outline">Accès sans compte</Button>
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
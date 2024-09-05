import React from 'react'
import Spline from '@splinetool/react-spline';

/**
 * The `Jerusalem` component renders a 3D scene using the `Spline` component from the `@splinetool/react-spline` library.
 * The `Spline` component is used to display a 3D model hosted at the specified URL.
 * 
 * The `scene` prop of the `Spline` component is set to a URL that points to the Spline design file for the 3D scene.
 * The `scene.splinecode` file contains the configuration and assets for rendering the 3D scene.
 * 
 * @returns {JSX.Element} A `div` containing the rendered 3D scene.
 */
const Jerusalem = () => {
  return (
    <div>
        <Spline scene="https://prod.spline.design/3k6H1cbqT90axTHH/scene.splinecode" />
    </div>
  )
}

export default Jerusalem
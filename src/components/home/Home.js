import React, {useEffect, useState }from 'react';
import { Input, message, Table, Form, Button, InputNumber } from 'antd';
import useForm from '../../Hook/useForm.js'
function Home() {
  document.title = "Calculadora de Subredes"
  const [form,formedit] = useForm();
  const [data, setData] = useState([]);
  const [valido, setValido] = useState();
  const columns = [
    {
      title: "Numero de Subred",
      dataIndex: "subred",
      key: 'subred',
    },
    {
      title: "Direccion de Subred",
      dataIndex: "direccion",
      key: 'direccion',
    },
    {
      title: "Primer dir IP Host",
      dataIndex: "pip",
      key: 'pip',
    },
    {
      title: "Ultima dir IP Host",
      dataIndex: "uip",
      key: 'uip',
    },
    {
      title: "Dir Brodcast",
      dataIndex: "brodcast",
      key: 'brodcast',
    },
    {
      title: "Mascara",
      dataIndex: "mascara",
      key: 'mascara',
    }

  ]


  const pushear = () =>{
    if(form.direccionIP && form.numSub){
      const direccion = form.direccionIP.split(".");
      const numSub = parseInt(form.numSub,10);
      let isnum = /^\d+$/.test(numSub);
      if(!isnum){
        setValido("Ingresa un numero de subredes valido");
        setData([]);
      }
      if(direccion.length !== 4){
        setValido("Direccion no valida ingresa otra con el formato punteado");
        setData([]);
      }
      else{
        if(checarDireccion(direccion)){
          const clase = calcularClase(parseInt(direccion[0],10),numSub);
          if(cabe(numSub,clase)){
            const mascara = calcularMascara(clase,numSub);
            let red = calcularDireccionRed(clase,direccion);
            let nuevos = crearSubredes(red,numSub,mascara);
            setData(nuevos);
          }else{
            setValido("Eres ambicisioso pero no caben tantas subredes en tu direccion IP, prueba otra");
            setData([]);
          }
        }
      }

    }else{
      setValido("Porfavor ingresa todos los campos  ")
      setData([]);
    }
  }

  const crearSubredes = (red,numSub,mascara) =>{
    let nuevosDatos = [];
    const tam = 2 **(7-calcularBitsSub(numSub));
    for(let i = 0; i < numSub; i++){
        red = calcularedActual(red,numSub,i);
        nuevosDatos.push({
          key: i,
          subred: i+1,
          direccion: calcularedActual(red,numSub,i).join("."),
          pip:calcularPrimera(red,numSub,i).join("."),
          uip: calcularUltima(red,numSub,i+1).join("."),
          brodcast:"as",
          mascara:mascara.join(".")
        })
    }
    return nuevosDatos;
  }

  const calcularedActual = (red,numSub,actual) =>{
    let nue = [];
    red.map(e=> nue.push(e));
    let suma = actual * (2 ** (8-calcularBitsSub(numSub)));
    for(let i = 3; i >= 0; i--){
      if(suma >= 255){
        nue[i] = suma - 255;
        suma = suma - 255;
      }
      else{
        nue[i] = suma;
        i=-1;
      }
    }
    return nue;
  }

  const calcularPrimera = (red,numSub,actual) =>{
    let nue = [];
    red.map(e=> nue.push(e));
    nue = calcularedActual(nue,numSub,actual);
    for(let i = 3; i >= 0; i--){
      if(nue[i] < 255){
        nue[i] = nue[i]+1;
        i=-1;
      }
    }
    return nue;
  }

  const calcularUltima = (red,numSub,actual) =>{
    let nue = [];
    red.map(e=> nue.push(e));
    let suma = actual * (2 ** (8-calcularBitsSub(numSub)));
    suma--;
    for(let i = 3; i >= 0; i--){
      if(suma >= 255){
        nue[i] = suma - 255;
        suma = suma - 255;
      }
      else{
        nue[i] = suma;
        i=-1;
      }
    }
    return nue;
  }

  const checarDireccion = (direccion) =>{
    for(let i =0 ; i<direccion.length; i++){
      const valid = /^\d+$/.test(direccion[i]);
      if(!valid || (direccion[i].length < 0 && direccion[i].length > 4)){
        setValido("Direccion no valida ingresa otra con el formato punteado puto");
        return false;
      }
    }
    return true;
  }

  const cabe = (numSub,clase) =>{
    if(clase ==="A" && numSub <= 8388608) return true
    else if(clase ==="B" && numSub <= 32768) return true
    else if(clase ==="C" && numSub <= 128) return true
    return false;
  }

  const calcularClase = (primerO, numSub) =>{
    let clase;
    const bits = calcularBitsSub(numSub);
    if(primerO<=127) clase = "A"
    else if(primerO > 127 && primerO <= 191)clase = "B"
    else if(primerO > 191 && primerO <= 223) clase = "C"
    else if(primerO > 223 && primerO <= 239) clase = "D"
    else if(primerO > 240 && primerO <= 255) clase = "E"
    else {
      setValido("Red no valida ingresa otra");
      return "F"
    }
    setValido("Red Clase " +clase+ " con " + bits + " bit para subnetting");
    return clase;
  }

  const calcularDireccionRed = (clase, direccionIP) => {
    let red = direccionIP;
    if(clase == "A") red[1,2,3] = 0;
    else if(clase =="B") red[2,3] = 0;
    else if(clase =="C") red[3] = 0;
    return red
  }

  const calcularMascara = (clase, numSub) =>{
    const sub = calcularBitsSub(numSub);
    if(clase == "A") return prestarAhost([255,0,0,0],sub);
    else if(clase == "B") return prestarAhost([255,255,0,0],sub);
    else if(clase =="C") return prestarAhost([255,255,255,0],sub);
    else return prestarAhost([255,255,255,255],sub);
  }

  const prestarAhost = (mascara, sub) =>{
    let suma = 0;
    console.log(sub)
    for(let i = 0; i < sub; i++ ){
      suma += 2**(7-i);
    }
    for(let i = 0; i<4;i++){
      if(mascara[i] != 255){
        if(suma>255){
          mascara[i] = 255;
          suma -= 255;
        }else{
          mascara[i] = suma;
          suma = 0;
          i = 4;
        }
      }
    }
    return mascara;
  }


  const calcularBitsSub = (numSub) =>{
    let numero = 1;
    while(2**numero < numSub) numero++;
    return numero;
  }

  return (
    <div>
      <h1>Bienvenido a calcular las direcciones ip</h1>
      <h2> Cual direccion quieres usar? </h2>
      <Form layout = 'horizontal'>
        <Form.Item label="Direccion IP" name = "direccionIP">
          <Input placeholder = "Ingresa tu direccion IP" name="direccionIP"
                  onChange={e => formedit(e)}/>
        </Form.Item>
        <Form.Item label="Numbero de Subredes" name = "numSub">
          <Input placeholder = "Cuantas subredes deseas" name="numSub" type="number"
                  onChange = {e => formedit(e)}/>
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={pushear} >Submit</Button>
        </Form.Item>
      </Form>
      <h1>{valido}</h1>
      <Table columns={columns} dataSource={data} />
    </div>
  );
}

export default Home;

import React from 'react'
import Router from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { Container, Row, Col, Nav, NavItem, Button, Form, NavLink, Collapse,
         Navbar, NavbarToggler, NavbarBrand, Modal, ModalHeader, ModalBody,
         ModalFooter } from 'reactstrap'
import Signin from './signin'
import Session from './session'
import Cookies from './cookies'
import Package from '../package'
import Styles from '../css/index.scss'

export default class extends React.Component {

  static propTypes() {
    return {
      session: React.PropTypes.object.isRequired,
      children: React.PropTypes.object.isRequired,
      fluid: React.PropTypes.boolean
    }
  }
  
  constructor(props) {
    super(props)
    this.state = {
      navOpen: false,
      modal: false
    }
    this.toggleModal = this.toggleModal.bind(this)
  }
  
  toggleModal(e) {
    if (e) e.preventDefault()

    if (this.state.modal !== true)
      Cookies.save('redirect_url', window.location.pathname)

    this.setState({
      modal: !this.state.modal
    })
  }
  
  render() {
    return (
      <React.Fragment>
        <Head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <title>{this.props.title || 'Next.js Starter Project'}</title>
          <style dangerouslySetInnerHTML={{__html: Styles}}/>
          <script src="https://cdn.polyfill.io/v2/polyfill.min.js"/>
        </Head>
        <Navbar light className="navbar navbar-expand-md pt-3 pb-3">
          <Link prefetch href="/">
            <NavbarBrand href="/">
              <span className="icon ion-md-home mr-1"></span> {Package.name}
            </NavbarBrand>
          </Link>
          <input className="nojs-navbar-check" id="nojs-navbar-check" type="checkbox" aria-label="Menu"/>
          <label tabIndex="1" htmlFor="nojs-navbar-check" className="nojs-navbar-label" />
          <div className="nojs-navbar">
            <Nav navbar>
              <div tabIndex="1" className="dropdown nojs-dropdown">
                <div className="nav-item">
                  <span className="dropdown-toggle nav-link">Examples</span>
                </div>
                <div className="dropdown-menu">
                  <Link prefetch href="/examples/layout">
                    <a href="/examples/layout" className="dropdown-item">Layout</a>
                  </Link>
                  <Link prefetch href="/examples/styling">
                    <a href="/examples/styling" className="dropdown-item">Styling</a>
                  </Link>
                  <Link prefetch href="/examples/async">
                    <a href="/examples/async" className="dropdown-item">Async Data</a>
                  </Link>
                  <Link prefetch href="/examples/routing">
                    <a href="/examples/routing" className="dropdown-item">Routing</a>
                  </Link>
                  <Link prefetch href="/examples/authentication">
                    <a href="/examples/authentication" className="dropdown-item">Authentication</a>
                  </Link>
                </div>
              </div>
            </Nav>
            <UserMenu session={this.props.session} toggleModal={this.toggleModal}/>
          </div>
        </Navbar>
        <MainBody navmenu={this.props.navmenu} fluid={this.props.fluid} container={this.props.container}>
          {this.props.children}
        </MainBody>
        <Container fluid={this.props.fluid}>
          <hr className="mt-3"/>
          <p className="text-muted small">
            <Link href="https://github.com/iaincollins/nextjs-starter"><a className="text-muted font-weight-bold">{Package.name} {Package.version}</a></Link>
            <span> built with </span>
            <Link href="https://github.com/zeit/next.js"><a className="text-muted font-weight-bold">Next.js {Package.dependencies.next.replace('^', '')}</a></Link>
            <span> &amp; </span>
            <Link href="https://github.com/facebook/react"><a className="text-muted font-weight-bold">React {Package.dependencies.react.replace('^', '')}</a></Link>
            .
            <span className="ml-2">&copy; {Package.author}, {new Date().getYear() + 1900}.</span>
          </p>
        </Container>
        <SigninModal modal={this.state.modal} toggleModal={this.toggleModal} session={this.props.session}/>
      </React.Fragment>
    )
  }
}

export class MainBody extends React.Component {
  render() {
    if (this.props.container === false) {
      return (
        <React.Fragment>
          {this.props.children}
        </React.Fragment>
      )
    } else if (this.props.navmenu === false) {
      return (
        <Container fluid={this.props.fluid} style={{marginTop: '1em'}}>
          {this.props.children}
        </Container>
      )
    } else {
      return (
        <Container fluid={this.props.fluid} style={{marginTop: '1em'}}>
          <Row>
            <Col md="10" xs="12">
              {this.props.children}
            </Col>
            <Col md="2" xs="12" style={{paddingTop: '1em'}}>
              <h5 className="text-muted text-uppercase">Examples</h5>
              <Nav vertical>
                <NavItem>
                  <Link prefetch href="/examples/layout"><NavLink href="/examples/layout" className="pl-0">Layout</NavLink></Link>
                </NavItem>
                <NavItem>
                  <Link prefetch href="/examples/styling"><NavLink href="/examples/styling" className="pl-0">Styling</NavLink></Link>
                </NavItem>
                <NavItem>
                  <Link prefetch href="/examples/async"><NavLink href="/examples/async" className="pl-0">Async Data</NavLink></Link>
                </NavItem>
                <NavItem>
                  <Link prefetch href="/examples/routing/?id=example" as="/custom-route/example"><NavLink href="/custom-route/example" className="pl-0">Routing</NavLink></Link>
                </NavItem>
                <NavItem>
                  <Link prefetch href="/examples/authentication"><NavLink href="/examples/authentication" className="pl-0">Authentication</NavLink></Link>
                </NavItem>
              </Nav>
            </Col>
          </Row>
        </Container>
      )
    }
  }
}

export class UserMenu extends React.Component {
  constructor(props) {
    super(props)
    this.handleSignoutSubmit = this.handleSignoutSubmit.bind(this)
  }

   async handleSignoutSubmit(event) {
     event.preventDefault()
     await Session.signout()
     Router.push('/')
   }
   
  render() {
    if (this.props.session && this.props.session.user) {
      const session = this.props.session
      return (
        <Nav className="ml-auto" navbar>
          {/*<!-- Uses .nojs-dropdown CSS to for a dropdown that works without client side JavaScript ->*/}
          <div tabIndex="2" className="dropdown nojs-dropdown">
            <div className="nav-item">
              <span className="dropdown-toggle d-none d-sm-block">
                <span className="icon ion-md-contact" style={{fontSize: '1.6em'}}></span>
              </span>
              <span className="dropdown-toggle d-block d-sm-none">
                <span className="icon ion-md-contact mr-2"></span>
                {session.user.name || session.user.email}
              </span>
            </div>
            <div className="dropdown-menu">
              <Link prefetch href="/account">
                <a href="/account" className="dropdown-item">Your Account</a>
              </Link>
              <div className="dropdown-divider d-none d-sm-block"/>
              <div className="dropdown-item p-0">
                <Form id="signout" method="post" action="/auth/signout" onSubmit={this.handleSignoutSubmit}>
                  <input name="_csrf" type="hidden" value={this.props.session.csrfToken}/>
                  <Button type="submit" block className="pl-4 rounded-0 text-left dropdown-item"><span className="icon ion-md-log-out mr-1"></span> Sign out</Button>
                </Form>
              </div>
            </div>
          </div>
        </Nav>
      )
    } else {
      return (
        <Nav className="ml-auto" navbar>
          <NavItem>
            {/**
              * @TODO Add support for passing current URL path as redirect URL
              * so that users without JavaScript are also redirected to the page
              * they were on before they signed in.
              **/}
            <a href="/auth/signin?redirect=/" className="btn btn-outline-primary" onClick={this.props.toggleModal}><span className="icon ion-md-log-in mr-1"></span> Sign up / Sign in</a>
          </NavItem>
        </Nav>
      )
    }
  }
}

export class SigninModal extends React.Component {
  render() {
    return (
      <Modal isOpen={this.props.modal} toggle={this.props.toggleModal} style={{maxWidth: 700}}>
        <ModalHeader>Sign up / Sign in</ModalHeader>
        <ModalBody style={{padding: '1em 2em'}}>
          <Signin session={this.props.session}/>
        </ModalBody>
      </Modal>
    )
  }
}
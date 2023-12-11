import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {Component1Component} from "./component1/component1.component";
import {Component2Component} from "./component2/component2.component";

const routes: Routes = [
  {path: 'component1', component: Component1Component},
  {path: 'component1', component: Component1Component, outlet: 'outlet1'},
  {path: 'component1', component: Component1Component, outlet: 'outlet2'},

  {path: 'component2', component: Component2Component},
  {path: 'component2', component: Component2Component, outlet: 'outlet1'},
  {path: 'component2', component: Component2Component, outlet: 'outlet2'},

  {path: 'component1/:id', component: Component1Component},
  {path: 'component1/:id', component: Component1Component, outlet: 'outlet1'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

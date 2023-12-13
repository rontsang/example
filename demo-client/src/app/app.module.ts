import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {Component1Component} from "./component1/component1.component";
import {Component2Component} from "./component2/component2.component";
import {RouterModule} from '@angular/router';
import {NgChartsModule} from 'ng2-charts';
import {MoneyTimeChartComponent} from "./money-time-chart/money-time-chart.component";

@NgModule({
  declarations: [
    AppComponent,
    Component1Component,
    Component2Component,
    MoneyTimeChartComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule,
    NgChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

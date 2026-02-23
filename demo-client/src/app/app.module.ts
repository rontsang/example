import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// import {Component1Component} from "./component1/component1.component";
// import {Component2Component} from "./component2/component2.component";
// import {RouterModule} from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { UserInputComponent } from "./userinput/userinput.component";
import { CurrencyFormatDirective } from './userinput/currency-format.directive';
import { DisplaywindowComponent } from './displaywindow/displaywindow.component';
import { MatSliderModule } from "@angular/material/slider";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {RoundToTenPipe} from "./round-to-ten.pipe";


@NgModule({
  declarations: [
    AppComponent,
    // Component1Component,
    // Component2Component,
    UserInputComponent,
    CurrencyFormatDirective,
  ],
    imports: [
        BrowserModule,
        // AppRoutingModule,
        HttpClientModule,
        // RouterModule,
        ReactiveFormsModule,
        FormsModule,
        NgChartsModule,
        DisplaywindowComponent,
        MatSliderModule,
        BrowserAnimationsModule,
        RoundToTenPipe
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
